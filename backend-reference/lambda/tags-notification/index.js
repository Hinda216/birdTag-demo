import { SNSClient, PublishCommand, GetTopicAttributesCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";

const TOPIC_ARN_PREFIX = process.env.TOPIC_ARN_PREFIX;
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

async function getTopicArn(tag) {
  const topic_name = `${TOPIC_ARN_PREFIX}:bird-notifications-${tag.toLowerCase().replace(' ', '-')}`;
  const getTopicAttributesCommand = new GetTopicAttributesCommand({
    TopicArn: topic_name,
  });
  try {
    const response = await snsClient.send(getTopicAttributesCommand);
    if (response.Attributes.TopicArn) {
      const listSubscriptionsByTopicCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: topic_name,
      });
      const subscriptions = await snsClient.send(listSubscriptionsByTopicCommand);
      console.log(subscriptions);
      if (subscriptions.Subscriptions.length > 0) {
        return response.Attributes.TopicArn;
      }
      console.log(`Topic ${topic_name} for tag ${tag} found, but no subscribers found`);
    }
  } catch (error) {
    console.log(`Topic ${topic_name} for tag ${tag} not found`);
  }
  return null;
}

async function sendNotification(tag, fileId, fileType, s3Url, thumbnailUrl, operation, topicArn) {
  const operation_text = operation === 1 ? 'Added' : 'Removed';
  const subject = `🐦 BirdTag: Tags ${tag} had been ${operation_text}`;
  const message = `Tags ${tag} had been ${operation_text} for file ${fileType}`;

  if (thumbnailUrl) {
    message += `\n🖼️ Thumbnail URL: ${thumbnailUrl}`;
  } else {
    message += `\n🔗 File URL: ${s3Url}`;
  }

  message += `\n📁 File ID: ${fileId}`;
  message += `\n🐦 Detected Species: ${tag}\n\n`;

  message += `\n---`;
  message += `\nThis is an automated notification from the BirdTag system.`;
  message += `\nTo manage your subscriptions, please visit your notification settings.`;

  const response = await snsClient.send(new PublishCommand({
    TopicArn: topicArn,
    Subject: subject,
    Message: message,
  }));

  console.log("SNS ID:", response.MessageId, "Notification sent to:", topicArn, "for file:", fileId, "with tag:", tag, "and operation:", operation_text);
}

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const { fileId, fileType, tags, s3Url, thumbnailUrl, operation } = event;

  for (const tag of tags) {
    const topicArn = await getTopicArn(tag);
    if (!topicArn) {
      continue;
    }
    await sendNotification(tag, fileId, fileType, s3Url, thumbnailUrl, operation, topicArn);
  }

  return { statusCode: 200, body: "Notification sent" };
}
