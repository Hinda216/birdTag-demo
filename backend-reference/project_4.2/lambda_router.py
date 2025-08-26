import json
import os
import boto3

lambda_client = boto3.client('lambda')

# environment variable
TAG_IMAGE_LAMBDA_ARN = os.environ.get('TAG_IMAGE_LAMBDA_ARN')
TAG_VIDEO_LAMBDA_ARN = os.environ.get('TAG_VIDEO_LAMBDA_ARN')
TAG_AUDIO_LAMBDA_ARN = os.environ.get('TAG_AUDIO_LAMBDA_ARN')
BUILD_THUMBNAIL_LAMBDA_ARN = os.environ.get('BUILD_THUMBNAIL_LAMBDA_ARN')


def lambda_handler(event, context):
    try:
        record = event['Records'][0]
        s3_key = record['s3']['object']['key'].lower()

        print(f"[Router] Received file: {s3_key}")

        # image file
        if s3_key.endswith(('.jpg', '.jpeg', '.png')):
            print("[Router] Routing to image tagging lambda.")
            if TAG_IMAGE_LAMBDA_ARN:
                lambda_client.invoke(
                    FunctionName=TAG_IMAGE_LAMBDA_ARN,
                    InvocationType='Event',
                    Payload=json.dumps(event)
                )

            print("[Router] Routing to thumbnail lambda.")
            if BUILD_THUMBNAIL_LAMBDA_ARN:
                lambda_client.invoke(
                    FunctionName=BUILD_THUMBNAIL_LAMBDA_ARN,
                    InvocationType='Event',
                    Payload=json.dumps(event)
                )

        # video file
        elif s3_key.endswith(('.mp4', '.avi', '.mov')):
            print("[Router] Routing to video tagging lambda.")
            if TAG_VIDEO_LAMBDA_ARN:
                lambda_client.invoke(
                    FunctionName=TAG_VIDEO_LAMBDA_ARN,
                    InvocationType='Event',
                    Payload=json.dumps(event)
                )

        # audio file
        elif s3_key.endswith(('.mp3', '.wav', '.flac')):
            print("[Router] Routing to audio tagging lambda.")
            if TAG_AUDIO_LAMBDA_ARN:
                lambda_client.invoke(
                    FunctionName=TAG_AUDIO_LAMBDA_ARN,
                    InvocationType='Event',
                    Payload=json.dumps(event)
                )

        else:
            print(f"[Router] Unsupported file type: {s3_key}")

    except Exception as e:
        print(f"[Router] Error occurred: {str(e)}")
        raise e