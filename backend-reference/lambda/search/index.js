import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};

    // Parse tags from query parameters (tag1, count1, tag2, count2, etc.)
    const searchTags = {};
    let tagIndex = 1;

    while (queryParams[`tag${tagIndex}`]) {
      const tag = queryParams[`tag${tagIndex}`];
      const count = parseInt(queryParams[`count${tagIndex}`]) || 1;
      searchTags[tag] = count;
      tagIndex++;
    }

    if (Object.keys(searchTags).length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "At least one tag must be provided",
          details: "Use tag1, tag2, etc. with optional count1, count2, etc.",
        }),
      };
    }

    console.log("Search tags:", searchTags);

    // Build filter expression for tags
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.entries(searchTags).forEach(([tag, count], index) => {
      const tagKey = `#tag${index}`;
      const countKey = `:count${index}`;

      expressionAttributeNames[tagKey] = tag;
      expressionAttributeValues[countKey] = count;

      // Check if tag exists and has sufficient count
      filterExpressions.push(
        `attribute_exists(tags.${tagKey}) AND tags.${tagKey} >= ${countKey}`
      );
    });

    // Scan DynamoDB with filter expression to reduce data transfer
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: filterExpressions.join(" AND "),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };

    console.log("Scan params:", JSON.stringify(scanParams, null, 2));

    const result = await ddbDocClient.send(new ScanCommand(scanParams));

    // The FilterExpression already filters matching files, no additional filtering needed
    const matchingFiles = result.Items || [];

    // Prepare response URLs
    const links = matchingFiles
      .map((file) => {
        // For images, return thumbnail URL; for videos/audio, return full URL
        if (file.file_type === "image" && file.thumbnail_url) {
          return file.thumbnail_url;
        } else {
          return file.s3_url;
        }
      })
      .filter((url) => url); // Remove any undefined URLs

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        links: links,
      }),
    };
  } catch (error) {
    console.error("Error in search function:", error);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error during search operation",
        details: error.message,
      }),
    };
  }
};
