# lambda_function_video.py - COMPLETE VERSION WITH NOTIFICATION
import os
import boto3
import cv2
import json
from ultralytics import YOLO
from tempfile import NamedTemporaryFile

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

BUCKET_NAME = os.environ['UPLOAD_BUCKET']
TABLE_NAME = os.environ['DYNAMODB_TABLE']
NOTIFICATION_LAMBDA_ARN = os.environ.get('NOTIFICATION_LAMBDA_ARN')

def run_model_on_video(video_bytes, model_path='model.pt', confidence=0.5):
    """
    Run YOLO model on each frame of the video and return tag map: {species: count}
    """
    # Save video to a temporary file
    with NamedTemporaryFile(delete=False, suffix='.mp4') as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    model = YOLO(model_path)
    class_names = model.names
    tag_map = {}

    cap = cv2.VideoCapture(tmp_path)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Run YOLO model on each frame
        results = model(frame)[0]
        detections = results.boxes.cls.tolist() if results.boxes else []

        for cls_id in detections:
            species = class_names[int(cls_id)]
            tag_map[species] = tag_map.get(species, 0) + 1

    cap.release()
    return tag_map

def lambda_handler(event, context):
    try:
        # Get the S3 object key from event
        record = event['Records'][0]
        s3_key = record['s3']['object']['key']
        file_id = s3_key.split('/')[-1].split('_')[0]  # Extract UUID

        if not s3_key.lower().endswith(('.mp4', '.avi', '.mov')):
            print(f"Skipped non-video file: {s3_key}")
            return

        # Download video from S3
        response = s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        video_bytes = response['Body'].read()

        # Run detection
        tags = run_model_on_video(video_bytes)

        # Update DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression="set file_type = :ftype, tags = :tags, s3_url = :url",
            ExpressionAttributeValues={
                ':ftype': 'video',
                ':tags': tags,
                ':url': s3_url
            }
        )

        print(f"[Video Lambda] Tags updated for {file_id}: {tags}")

        # Trigger notification if tags were detected and notification lambda is configured
        if tags and NOTIFICATION_LAMBDA_ARN:
            trigger_notification(file_id, 'video', tags, s3_url)

    except Exception as e:
        print(f"[Video Lambda] Error: {str(e)}")
        raise e


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