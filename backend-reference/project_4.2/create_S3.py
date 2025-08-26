import boto3
from botocore.exceptions import ClientError

# Replace with your target bucket name and region
bucket_name = 'birdnet-files-bucket-fit5225-25s1-group85'  # must be globally unique
region = 'us-east-1'

def create_s3_bucket(bucket_name, region):
    try:
        s3 = boto3.client('s3', region_name=region)

        # Create bucket with region config (required for non us-east-1)
        s3.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={
                'LocationConstraint': region
            }
        )

        print(f"S3 bucket '{bucket_name}' created in region '{region}'.")

    except ClientError as e:
        if e.response['Error']['Code'] == 'BucketAlreadyOwnedByYou':
            print(f"Bucket '{bucket_name}' already exists and is owned by you.")
        elif e.response['Error']['Code'] == 'BucketAlreadyExists':
            print(f"Bucket name '{bucket_name}' is already taken globally. Choose a new name.")
        else:
            print("Error:", e)

if __name__ == "__main__":
    create_s3_bucket(bucket_name, region)