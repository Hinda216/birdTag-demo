import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

SUBSCRIPTIONS_TABLE = os.environ['SUBSCRIPTIONS_TABLE']

def lambda_handler(event, context):
    """
    Handle user subscription operations for bird species notifications.
    Creates individual SNS topics for each bird species to ensure users only
    receive notifications for their subscribed species.
    """
    try:
        # Parse and validate request body
        try:
            body = json.loads(event['body'] or '{}')
        except Exception as e:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid JSON format'}),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
        
        user_email = body.get('email')
        species = body.get('species')
        
        # Validate required parameters
        if not user_email or not species:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Email and species are required'}),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
        
        table = dynamodb.Table(SUBSCRIPTIONS_TABLE)
        
        # Create individual SNS Topic for each species
        # Topic naming convention: bird-notifications-{species}
        topic_name = f"bird-notifications-{species.lower().replace(' ', '-')}"
        
        try:
            # Create topic (returns existing ARN if topic already exists)
            create_response = sns.create_topic(Name=topic_name)
            topic_arn = create_response['TopicArn']
            
            # Subscribe user email to the species-specific topic
            sns.subscribe(
                TopicArn=topic_arn,
                Protocol='email',
                Endpoint=user_email
            )
            
        except Exception as e:
            print(f"SNS topic creation/subscription error: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'Failed to create/subscribe to topic: {str(e)}'}),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
        
        try:
            # Store subscription record in DynamoDB
            subscription_id = f"{user_email}#{species.lower()}"
            table.put_item(
                Item={
                    'user_email': user_email,
                    'tag': species.lower(),
                    'subscription_id': subscription_id,
                    'topic_arn': topic_arn,  # Store corresponding topic ARN
                    'created_date': '2025-06-01T00:00:00Z'
                }
            )
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'message': f'Successfully subscribed to {species}',
                    'subscriptionId': subscription_id
                }),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
            
        except Exception as e:
            print(f"Error subscribing to species {species}: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'Failed to subscribe: {str(e)}'}),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
        
    except Exception as e:
        print(f"Error in subscription: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'}
        }
