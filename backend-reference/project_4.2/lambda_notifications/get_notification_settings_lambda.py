# get_notification_settings_lambda.py - Enhanced with topic ARN information
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
SUBSCRIPTIONS_TABLE = os.environ['SUBSCRIPTIONS_TABLE']

def lambda_handler(event, context):
    """
    Retrieve user's current notification settings.
    Returns all bird species subscriptions for the specified user.
    """
    try:
        # Extract and validate query parameters
        query_params = event.get('queryStringParameters') or {}
        user_email = query_params.get('email')

        if not user_email:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'User email is required. Use ?email=user@example.com'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        table = dynamodb.Table(SUBSCRIPTIONS_TABLE)
        
        # Query all subscriptions for the specified user
        response = table.query(
            IndexName='user-email-index',
            KeyConditionExpression='user_email = :email',
            ExpressionAttributeValues={':email': user_email}
        )
        
        # Format subscription settings for response
        settings = []
        for item in response['Items']:
            settings.append({
                'id': item['subscription_id'],  # Unique subscription identifier
                'birdSpecies': item['tag'],     # Bird species name
                'emailEnabled': True,          # Email notifications are enabled
                'createdDate': item.get('created_date', '2025-06-01T00:00:00Z'),
                'topicArn': item.get('topic_arn', '')  # Corresponding SNS topic ARN
            })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'settings': settings,
                'user_email': user_email,
                'total_subscriptions': len(settings)
            }),
            'headers': {'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'}
        }
        
    except Exception as e:
        print(f"Error retrieving notification settings: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)}),
            'headers': {'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'}
        }