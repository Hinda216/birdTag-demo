import os
import json
import base64
from email.parser import BytesParser
from uuid import uuid4
from yolo_detector import run_detection
from run_birdnet import run_model_on_audio_bytes
import boto3
import traceback
from boto3.dynamodb.types import TypeSerializer

DYNAMODB_TABLE_NAME = os.getenv('DYNAMODB_TABLE_NAME')
BUCKET_NAME = os.getenv('BUCKET_NAME')

dynamodb_client = boto3.client('dynamodb')
s3_client = boto3.client('s3')

def parse_multipart_form_data(content_type: str, body: bytes):
    """
    Parses multipart/form-data content from bytes.
    """
    try:
        # We need to construct a message with headers and body
        # The parser needs the Content-Type header to find the boundary.
        headers = f"Content-Type: {content_type}\n\n".encode('utf-8')
        message = headers + body
        email_message = BytesParser().parsebytes(text=message, headersonly=False)

        if not email_message.is_multipart():
            raise ValueError("Message is not multipart.")

        return {
            part.get_param('name', header='content-disposition'): {
                'content_type': part.get_content_type(),
                'content': part.get_payload(decode=True) # Returns bytes
            }
            for part in email_message.get_payload() if part.get_param('name', header='content-disposition')
        }
    except Exception as e:
        print(f"Error parsing multipart/form-data: {e}")
        raise ValueError("Failed to parse multipart/form-data.") from e

def mapping_file_type_to_type(file_type: str):
    """
    Maps a file type to a type.
    """
    file_type = file_type.lower()
    # image
    if file_type == 'image/png':
        return 'image'
    elif file_type == 'image/jpeg':
        return 'image'
    elif file_type == 'image/jpg':
        return 'image'
    elif file_type == 'image/gif':
        return 'image'
    elif file_type == 'image/webp':
        return 'image'

    # video
    elif file_type == 'video/mp4':
        return 'video'
    elif file_type == 'video/mov':
        return 'video'
    elif file_type == 'video/avi':
        return 'video'

    # audio
    elif file_type == 'audio/mp3':
        return 'audio'
    elif file_type == 'audio/wav':
        return 'audio'
    elif file_type == 'audio/ogg':
        return 'audio'
    elif file_type == 'audio/m4a':
        return 'audio'
    elif file_type == 'audio/aac':
        return 'audio'
    elif file_type == 'audio/ogg':
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

def dispatch_detection(file_path: str, file_type: str):
    """
    Runs detection on a file by dispatching to the correct model.
    """
    if file_type == 'image' or file_type == 'video':
        return run_detection(file_path, file_type)
    elif file_type == 'audio':
        return run_model_on_audio_bytes(file_path)

def lambda_handler(event, context):
    s3_url = event['s3_url']
    filename = os.path.basename(s3_url)
    s3_key = "tmp/" + s3_url
    file_path = f"/tmp/{filename}"
    print(f"Processing file: {s3_url}")
    try:
        response = dynamodb_client.query(
            TableName=DYNAMODB_TABLE_NAME,
            KeyConditionExpression='s3_url = :s3_url',
            ExpressionAttributeValues={
                ':s3_url': {'S': s3_url}
            }
        )

        if not response.get('Items'):
            raise ValueError(f"Item with s3_url {s3_url} not found in DynamoDB.")

        item = None
        for i in response['Items']:
            if i.get('status', {}).get('S') != 'done':
                item = i
                break

        if item is None:
            # Item is already processed or doesn't have a processable status
            print(f"No item to process for s3_url {s3_url} or it's already done.")
            return
        
        old_status = item['status']['S']

        s3_client.download_file(Bucket=BUCKET_NAME, Key=s3_key, Filename=file_path)
        print(f"Downloaded file to: {os.path.exists(file_path)}, {file_path}")

        file_type = item['file_type']['S']
        print(f"File type: {file_type}")

        detected_tags = dispatch_detection(file_path, file_type)
        print(f"Detected tags: {detected_tags}")

        tags = detected_tags['tags']
        serializer = TypeSerializer()
        tags_serialized = serializer.serialize(tags)
        print(f"Tags serialized: {tags_serialized}")

        dynamodb_client.update_item(
            TableName=DYNAMODB_TABLE_NAME,
            Key={
                's3_url': {'S': s3_url},
            },
            UpdateExpression='SET #tags = :tags, #status = :status',
            ExpressionAttributeNames={
                '#tags': 'tags',
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':tags': tags_serialized,
                ':status': {'S': 'done'}
            }
        )
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=s3_key)
    except Exception as e:
        dynamodb_client.update_item(
            TableName=DYNAMODB_TABLE_NAME,
            Key={
                's3_url': {'S': s3_url},
            },
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':status': {'S': 'error'}
            }
        )
        print(f"Error in lambda_handler: {e}")
        traceback.print_exc()
        raise e

    finally:
        # Ensure the temporary file is cleaned up
        if os.path.exists(file_path):
            os.remove(file_path)

        
