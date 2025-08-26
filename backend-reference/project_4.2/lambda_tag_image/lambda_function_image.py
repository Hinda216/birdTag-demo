# lambda_function_image.py - COMPLETE VERSION WITH NOTIFICATION
import os
import boto3
import cv2 as cv
import numpy as np
import json
from ultralytics import YOLO

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

# Environment variables
BUCKET_NAME = os.environ['UPLOAD_BUCKET']
TABLE_NAME = os.environ['DYNAMODB_TABLE']
NOTIFICATION_LAMBDA_ARN = os.environ.get('NOTIFICATION_LAMBDA_ARN')


def run_model_and_get_tags(image_bytes, model_path='model.pt', confidence=0.5):
    """
    Run the YOLO model on image bytes and return tags in {species: count} format.
    """
    # Decode image bytes to OpenCV format
    np_arr = np.frombuffer(image_bytes, np.uint8)
    image = cv.imdecode(np_arr, cv.IMREAD_COLOR)

    if image is None:
        raise ValueError("Failed to decode image bytes to OpenCV format")

    # Run the model
    model = YOLO(model_path)
    results = model(image)[0]

    class_names = model.names
    detections = results.boxes.cls.tolist() if results.boxes else []

    # Count detected classes
    tag_map = {}
    for cls_id in detections:
        species = class_names[int(cls_id)]
        tag_map[species] = tag_map.get(species, 0) + 1

    return tag_map


def lambda_handler(event, context):
    try:
        # Parse event data
        record = event['Records'][0]
        s3_key = record['s3']['object']['key']
        file_id = s3_key.split('/')[-1].split('_')[0]

        # Only handle image files
        if not s3_key.lower().endswith(('.jpg', '.jpeg', '.png')):
            print(f"Skipped non-image file: {s3_key}")
            return

        # Download image from S3
        response = s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        image_bytes = response['Body'].read()

        # Run detection model
        tags = run_model_and_get_tags(image_bytes)

        # Update DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        s3_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
        thumbnail_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/thumbnails/{file_id}_thumb.jpg"
        
        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression="set file_type = :ftype, tags = :tags, s3_url = :url, thumbnail_url = :thumb",
            ExpressionAttributeValues={
                ':ftype': 'image',
                ':tags': tags,
                ':url': s3_url,
                ':thumb': thumbnail_url
            }
        )

        print(f"Tags updated for file_id {file_id}: {tags}")

        # Trigger notification if tags were detected and notification lambda is configured
        if tags and NOTIFICATION_LAMBDA_ARN:
            trigger_notification(file_id, 'image', tags, s3_url, thumbnail_url)

    except Exception as e:
        print(f"Error in tag lambda: {str(e)}")
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
