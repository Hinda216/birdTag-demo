import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const thumbnailUrl = queryParams.thumbnailUrl;

    if (!thumbnailUrl) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing required parameter: thumbnailUrl",
          details: "Please provide the thumbnail URL as a query parameter",
        }),
      };
    }

    console.log("Looking for file with thumbnail URL:", thumbnailUrl);

    // Search for the file with the matching thumbnail URL
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: "thumbnail_url = :thumbnailUrl",
      ExpressionAttributeValues: {
        ":thumbnailUrl": thumbnailUrl,
      },
    };

    const result = await ddbDocClient.send(new ScanCommand(scanParams));

    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "File not found",
          details: "No file found with the provided thumbnail URL",
        }),
      };
    }

    const file = result.Items[0];

    // Check if this is actually an image
    if (file.file_type !== "image") {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Invalid file type",
          details: "The provided URL does not correspond to an image file",
        }),
      };
    }

    if (!file.s3_url) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Full-size image not found",
          details: "No full-size image URL available for this file",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        fullSizeUrl: file.s3_url,
      }),
    };
  } catch (error) {
    console.error("Error in images-get function:", error);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error while retrieving full-size image URL",
        details: error.message,
      }),
    };
  }
};
