# unsubscribe_lambda.py - Fixed version with proper SNS unsubscription  
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

SUBSCRIPTIONS_TABLE = os.environ['SUBSCRIPTIONS_TABLE']

def lambda_handler(event, context):
    """
    Handle user unsubscription operations.
    Removes user from both DynamoDB records and SNS topic subscriptions.
    """
    try:
        # Parse and validate request body
        try:
            body = json.loads(event['body'] or '{}')
        except Exception:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid JSON format'}),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
        
        species = body.get('species')
        user_email = body.get('email')
        
        # Validate required parameters
        if not species or not user_email:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Species and email are required'}),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
        
        table = dynamodb.Table(SUBSCRIPTIONS_TABLE)
        
        try:
            # Remove subscription record from DynamoDB
            subscription_id = f"{user_email}#{species.lower()}"
            
            # First, get subscription info to obtain the topic ARN
            response = table.get_item(
                Key={'subscription_id': subscription_id}
            )
            
            if 'Item' in response:
                topic_arn = response['Item'].get('topic_arn')
                
                # Unsubscribe from the SNS topic
                if topic_arn:
                    try:
                        # Get all subscriptions for this topic
                        subscriptions = sns.list_subscriptions_by_topic(TopicArn=topic_arn)
                        
                        # Find and unsubscribe the user's email subscription
                        for sub in subscriptions['Subscriptions']:
                            if sub['Endpoint'] == user_email and sub['Protocol'] == 'email':
                                sns.unsubscribe(SubscriptionArn=sub['SubscriptionArn'])
                                print(f"Unsubscribed {user_email} from {species} notifications")
                                break
                                
                    except Exception as e:
                        print(f"Error unsubscribing from SNS topic: {e}")
            
            # Remove record from DynamoDB
            table.delete_item(
                Key={'subscription_id': subscription_id}
            )
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': True,
                    'message': f'Successfully unsubscribed from {species}'
                }),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
            
        except Exception as e:
            print(f"Error removing subscription for species {species}: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({'error': f'Failed to unsubscribe: {str(e)}'}),
                'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'}
            }
        
    except Exception as e:
        print(f"Error in unsubscription process: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'}
        }
