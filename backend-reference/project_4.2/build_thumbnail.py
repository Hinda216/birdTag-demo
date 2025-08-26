import boto3
import os
from PIL import Image
from io import BytesIO

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET_NAME = os.environ['UPLOAD_BUCKET']
TABLE_NAME = os.environ['DYNAMODB_TABLE']

def lambda_handler(event, context):
    try:
        # Get object info from event
        record = event['Records'][0]
        s3_key = record['s3']['object']['key']
        file_id = record['s3']['object']['key'].split('/')[-1].split('_')[0]  # extract UUID
        file_name = record['s3']['object']['key'].split('/')[-1]

        if not s3_key.lower().endswith(('.jpg', '.jpeg', '.png')):
            print(f"Skipped non-image file: {file_name}")
            return

        # Download original image
        response = s3.get_object(Bucket=BUCKET_NAME, Key=s3_key)
        img_content = response['Body'].read()
        image = Image.open(BytesIO(img_content))

        # Create thumbnail
        image.thumbnail((256, 256))  # Resize while preserving aspect ratio
        thumb_buffer = BytesIO()
        image.save(thumb_buffer, format='JPEG')
        thumb_buffer.seek(0)

        # Upload thumbnail to S3
        thumbnail_key = f"thumbnails/{file_id}_thumb.jpg"
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=thumbnail_key,
            Body=thumb_buffer,
            ContentType='image/jpeg'
        )

        # Update DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        thumbnail_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{thumbnail_key}"

        table.update_item(
            Key={'file_id': file_id},
            UpdateExpression="set thumbnail_url = :thumb",
            ExpressionAttributeValues={
                ':thumb': thumbnail_url
            }
        )

        print(f"Thumbnail created and saved for {file_name}")

    except Exception as e:
        print(f"Error in thumbnail lambda: {str(e)}")
        raise e