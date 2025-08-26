import boto3

# Initialize DynamoDB client
dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# Define table name
table_name = 'birdnet-files-table-fit5225-25s1-group85'

# Create the DynamoDB table
try:
    response = dynamodb.create_table(
        TableName=table_name,
        KeySchema=[
            {
                'AttributeName': 'file_id',
                'KeyType': 'HASH'  # Partition key
            }
        ],
        AttributeDefinitions=[
            {
                'AttributeName': 'file_id',
                'AttributeType': 'S'  # String type
            }
        ],
        ProvisionedThroughput={
            'ReadCapacityUnits': 5,
            'WriteCapacityUnits': 5
        }
    )

    print(f"Creating table '{table_name}'...")
    print("Response:")
    print(response)

except dynamodb.exceptions.ResourceInUseException:
    print(f"Table '{table_name}' already exists.")

except Exception as e:
    print("Error creating table:", str(e))