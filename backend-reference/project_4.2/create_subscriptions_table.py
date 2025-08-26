
# create_subscriptions_table.py

import boto3
import json

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# Define table name
table_name = 'birdnet-subscriptions-table-fit5225-25s1-group85'

# Create the DynamoDB table
try:
    response = dynamodb.create_table(
        TableName=table_name,
        KeySchema=[
            {
                'AttributeName': 'subscription_id',
                'KeyType': 'HASH'  # Partition key: email#tag
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'subscription_id',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'user_email',
                'AttributeType': 'S'
            },
            {
                'AttributeName': 'tag',
                'AttributeType': 'S'
            }
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'user-email-index',
                'KeySchema': [
                    {
                        'AttributeName': 'user_email',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            },
            {
                'IndexName': 'tag-index',
                'KeySchema': [
                    {
                        'AttributeName': 'tag',
                        'KeyType': 'HASH'
                    }
                ],
                'Projection': {
                    'ProjectionType': 'ALL'
                },
                'ProvisionedThroughput': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                }
            }
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )

    print(f"Creating subscriptions table '{table_name}'...")
    print("Response:")
    print(response)

except dynamodb.exceptions.ResourceInUseException:
    print(f"Table '{table_name}' already exists.")

except Exception as e:
    print("Error creating subscriptions table:", str(e))