import json
import base64
import uuid
import boto3
import os
from datetime import datetime

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables for S3 bucket and DynamoDB table
BUCKET_NAME = os.environ['UPLOAD_BUCKET']
TABLE_NAME = os.environ['DYNAMODB_TABLE']

def lambda_handler(event, context):
    try:
        try:
            # Parse incoming JSON request body
            body = json.loads(event['body'] or '{}')
        except Exception:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': 'Invalid JSON input'
                }),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                }   
            }
        files = body.get('files', [])
        upload_batch = body.get('uploadBatch', 'unknown_batch')

        # Connect to DynamoDB table
        table = dynamodb.Table(TABLE_NAME)
        uploaded_files = []

        for file_obj in files:
            file_name = file_obj['fileName']
            file_type = file_obj['fileType']
            mime_type = file_obj['mimeType']
            base64_data = file_obj['base64Data']
            timestamp = file_obj.get('uploadTimestamp', datetime.now().isoformat())

            # Decode base64-encoded content to binary
            try:
                file_binary = base64.b64decode(base64_data)
            except Exception as e:
                raise ValueError(f"Failed to decode base64 data for {file_name}: {e}")

            # Generate a unique file ID
            file_id = str(uuid.uuid4())

            # Define S3 object key with date and UUID
            date_prefix = datetime.now().strftime("%Y-%m-%d")
            s3_key = f"uploads/{file_type.lower()}s/{date_prefix}/{file_id}_{file_name}"

            # Upload file to S3 bucket
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=file_binary,
                ContentType=mime_type,
                Metadata={
                    'file_id': file_id,
                    'upload_batch': upload_batch
                }
            )

            # Construct full S3 URL of the uploaded file
            s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

            # Create the DynamoDB item (record) with only allowed fields
            item = {
                'file_id': file_id,
                'file_type': file_type,
                'tags': {},  # To be filled later by tag detection Lambda
                's3_url': s3_url
            }

            # Save record to DynamoDB
            table.put_item(Item=item)

            # Prepare response object for this file
            uploaded_files.append({
                'file_id': file_id,
                'file_name': file_name,
                's3_url': s3_url,
            })

        # Return success response with uploaded file info
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'uploaded': uploaded_files
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }   
        }

    except Exception as e:
        print("Upload error:", str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }   
        }