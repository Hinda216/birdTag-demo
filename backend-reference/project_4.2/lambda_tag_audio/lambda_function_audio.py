# lambda_function_audio.py - COMPLETE VERSION WITH NOTIFICATION
import os
import boto3
import json
from run_birdnet import run_model_on_audio_bytes

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

# Environment variables (configured via Lambda console)
BUCKET_NAME = os.environ['UPLOAD_BUCKET']
TABLE_NAME = os.environ['DYNAMODB_TABLE']
NOTIFICATION_LAMBDA_ARN = os.environ.get('NOTIFICATION_LAMBDA_ARN')

def lambda_handler(event, context):
    try:
        # 1. Extract S3 event information
        record = event['Records'][0]
        s3_key = record['s3']['object']['key']
        file_id = s3_key.split('/')[-1].split('_')[0]  # Assumes file name format: {uuid}_xxx.wav

        # 2. Skip non-audio files (only .mp3 and .wav are supported)
        if not s3_key.lower().endswith(('.mp3', '.wav')):
            print(f"Skipped non-audio file: {s3_key}")
            return

        # 3. Download audio file from S3
        response = s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        audio_bytes = response['Body'].read()

        # 4. Determine file format (mp3 or wav)
        file_format = s3_key.split('.')[-1].lower()

        # 5. Run BirdNET model to detect species from audio
        tags = run_model_on_audio_bytes(audio_bytes, file_format=file_format)

        # 6. Update DynamoDB with the predicted tags
        table = dynamodb.Table(TABLE_NAME)
        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression="SET file_type = :ftype, tags = :tags, s3_url = :url",
            ExpressionAttributeValues={
                ':ftype': 'audio',
                ':tags': tags,
                ':url': s3_url
            }
        )

        print(f"Updated audio tags for file_id {file_id}: {tags}")

        # 7. Trigger notification if tags were detected and notification lambda is configured
        if tags and NOTIFICATION_LAMBDA_ARN:
            trigger_notification(file_id, 'audio', tags, s3_url)

    except Exception as e:
        print(f"Error processing audio: {e}")
        raise


def trigger_notification(file_id, file_type, tags, s3_url, thumbnail_url=None):
    """Trigger the notification lambda function"""
    try:
        payload = {
            'file_id': file_id,
            'file_type': file_type,
            'tags': tags,
            's3_url': s3_url,
            'thumbnail_url': thumbnail_url
        }
        
        lambda_client.invoke(
            FunctionName=NOTIFICATION_LAMBDA_ARN,
            InvocationType='Event',  # Asynchronous invocation
            Payload=json.dumps(payload)
        )
        
        print(f"Notification triggered for file {file_id}")
        
    except Exception as e:
        print(f"Error triggering notification: {e}")
        # Don't raise exception to avoid breaking the tagging process
