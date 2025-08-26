# create_sns_topic.py

import boto3
import json

sns = boto3.client('sns', region_name='us-east-1')

try:
    response = sns.create_topic(
        Name='birdnet-notifications-topic-fit5225-25s1-group85'
    )
    
    topic_arn = response['TopicArn']
    print(f"SNS Topic created: {topic_arn}")
    
    # Set topic policy to allow publishing
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": "*"
                },
                "Action": [
                    "SNS:Subscribe",
                    "SNS:Publish"
                ],
                "Resource": topic_arn
            }
        ]
    }
    
    sns.set_topic_attributes(
        TopicArn=topic_arn,
        AttributeName='Policy',
        AttributeValue=json.dumps(policy)
    )
    
    print("SNS Topic policy configured successfully.")

except Exception as e:
    print("Error creating SNS topic:", str(e))