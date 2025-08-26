import os
import json
from uuid import uuid4
import boto3
import traceback


BUCKET_NAME = os.getenv('BUCKET_NAME')
DYNAMODB_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME')

s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')

def mapping_file_type_to_type(file_type: str):
    """
    Maps a file type to a type.
    """
    file_type = file_type.lower()
    
    image_types = {'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'}
    video_types = {'video/mp4', 'video/mov', 'video/avi'}
    audio_types = {'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac'}

    if file_type in image_types:
        return 'image'
    if file_type in video_types:
        return 'video'
    if file_type in audio_types:
        return 'audio'
    
    return None


def get_extension(mime_type: str):
    """
    Get file extension from mime type.
    """
    # A map for common mimetypes to extensions
    ext_map = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/mov': '.mov',
        'video/avi': '.avi',
        'audio/mp3': '.mp3',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'audio/ogg': '.ogg',
        'audio/m4a': '.m4a',
        'audio/aac': '.aac',
    }
    return ext_map.get(mime_type.lower())


def lambda_handler(event, context):
    print(f"Event: {event}")
    try:
        body_str = event.get('body')
        if not body_str:
            raise ValueError("Request body is missing or empty.")
        
        body = json.loads(body_str)
        content_type = body.get('contentType')
        file_name = f'{uuid4()}{get_extension(content_type)}'
        s3_key = f"tmp/{file_name}"
        file_type = mapping_file_type_to_type(content_type)

        
        dynamodb_client.put_item(
            TableName=DYNAMODB_TABLE_NAME,
            Item={
                's3_url': {'S': file_name},
                'status': {'S': 'pending'},
                'file_type': {'S': file_type},
                'tags': {'M': {}}
            }
        )

        # Generate presigned URL for uploading
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': BUCKET_NAME,
                'Key': s3_key,
                'ContentType': content_type
            },
            ExpiresIn=3600  # URL expires in 1 hour
        )

        # This lambda now returns a presigned URL.
        # The client will use this URL to upload the file directly to S3.
        # The DynamoDB entry creation and the invocation of the next lambda
        # should be handled by another lambda triggered by the S3 upload event.
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'filePath': file_name
            })
        }
    except ValueError as e:
        print(f"Client error processing request: {e}")
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({'error': str(e), 'traceback': traceback.format_exc()})
        }
    except Exception as e:
        print(f"Server error processing request: {e}")
        return {
            'statusCode': 500, 
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            'body': json.dumps({'error': 'Internal server error.', 'traceback': traceback.format_exc()})
        }
