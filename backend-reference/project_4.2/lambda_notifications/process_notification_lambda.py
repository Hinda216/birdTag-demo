# process_notification_lambda.py - Fixed version for targeted notifications
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

SUBSCRIPTIONS_TABLE = os.environ['SUBSCRIPTIONS_TABLE']

def lambda_handler(event, context):
    """
    Process notification requests from tagging lambdas.
    Sends notifications only to users who subscribed to the detected bird species.
    Each species has its own SNS topic to ensure targeted notifications.
    """
    try: 
        # Extract payload from the triggering event
        file_id = event.get('file_id')
        file_type = event.get('file_type')
        tags = event.get('tags', {})
        s3_url = event.get('s3_url')
        thumbnail_url = event.get('thumbnail_url')
        
        if not tags:
            print("No tags detected, skipping notification")
            return
            
        detected_tags = list(tags.keys())
        print(f"Processing notifications for detected species: {detected_tags}")
        
        # Send individual notifications for each detected species
        for tag in detected_tags:
            send_notification_for_tag(file_id, file_type, tag, s3_url, thumbnail_url)
            
    except Exception as e:
        print(f"Error in notification processing: {e}")


def send_notification_for_tag(file_id, file_type, tag, s3_url, thumbnail_url):
    """
    Send notification for a specific bird species to its dedicated SNS topic.
    Only users subscribed to this particular species will receive the notification.
    """
    try:
        # Build topic name (must match the naming convention in subscribe_lambda)
        topic_name = f"bird-notifications-{tag.lower().replace(' ', '-')}"
        
        # Get or create the species-specific topic
        try:
            create_response = sns.create_topic(Name=topic_name)
            topic_arn = create_response['TopicArn']
        except Exception as e:
            print(f"Error creating/getting topic for species {tag}: {e}")
            return
        
        # Check if any users are subscribed to this specific species
        subscriptions_table = dynamodb.Table(SUBSCRIPTIONS_TABLE)
        try:
            response = subscriptions_table.query(
                IndexName='tag-index',
                KeyConditionExpression='tag = :tag',
                ExpressionAttributeValues={':tag': tag.lower()}
            )
            
            if not response['Items']:
                print(f"No subscribers found for species: {tag}")
                return
                
        except Exception as e:
            print(f"Error querying subscriptions for species {tag}: {e}")
            return
        
        # Build notification content
        subject = f"🐦 BirdTag: New {file_type} detected with {tag.title()}"
        
        message_body = f"""
BirdTag Notification: New {tag.title()} Detection!

A new {file_type} has been uploaded and contains: {tag}

📁 File ID: {file_id}
🐦 Detected Species: {tag}
🔗 File URL: {s3_url}
"""
        
        if thumbnail_url:
            message_body += f"🖼️ Thumbnail URL: {thumbnail_url}\n"
        
        message_body += """
---
This is an automated notification from the BirdTag system.
To manage your subscriptions, please visit your notification settings.
        """
        
        # Publish to the species-specific topic
        try:
            response = sns.publish(
                TopicArn=topic_arn,
                Subject=subject,
                Message=message_body
            )
            
            print(f"Notification sent for species {tag}, Message ID: {response.get('MessageId')}")
            
        except Exception as e:
            print(f"Error sending notification for species {tag}: {e}")
            
    except Exception as e:
        print(f"Error in send_notification_for_tag for species {tag}: {e}")