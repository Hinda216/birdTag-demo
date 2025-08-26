import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const TAGS_NOTIFICATION_LAMBDA_ARN = process.env.TAGS_NOTIFICATION_LAMBDA_ARN;
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

// Find file in database by S3 URL (either main URL or thumbnail URL)
async function findFileByUrl(url) {
  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: "s3_url = :url OR thumbnail_url = :url",
    ExpressionAttributeValues: {
      ":url": url,
    },
  };

  const result = await ddbDocClient.send(new ScanCommand(scanParams));
  return result.Items && result.Items.length > 0 ? result.Items[0] : null;
}

// Add tags to file
async function addTagsToFile(fileId, tagsToAdd) {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  let index = 0;
  for (const { species, count } of tagsToAdd) {
    if (typeof count !== "number" || count <= 0) {
      throw new Error(
        `Invalid count for tag "${species}": ${count}. Count must be a positive integer`
      );
    }

    const nameKey = `#tag${index}`;
    const valueKey = `:count${index}`;

    expressionAttributeNames[nameKey] = species;
    expressionAttributeValues[valueKey] = count;

    // Overwrite the tag value instead of adding to existing value
    updateExpressions.push(`tags.${nameKey} = ${valueKey}`);
    index++;
  }

  const updateParams = {
    TableName: TABLE_NAME,
    Key: { file_id: fileId },
    UpdateExpression: `SET ${updateExpressions.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  console.log("addTagsToFile updateParams", updateParams);
  await ddbDocClient.send(new UpdateCommand(updateParams));
}

// Remove tags from file
async function removeTagsFromFile(fileId, tagsToRemove) {
  // First, get the current file to check existing tags
  const scanParams = {
    TableName: TABLE_NAME,
    FilterExpression: "file_id = :fileId",
    ExpressionAttributeValues: {
      ":fileId": fileId,
    },
  };

  const result = await ddbDocClient.send(new ScanCommand(scanParams));
  if (!result.Items || result.Items.length === 0) {
    throw new Error(`File not found: ${fileId}`);
  }

  const file = result.Items[0];
  const currentTags = file.tags || {};

  const removeExpressions = [];
  const expressionAttributeNames = {};

  let index = 0;
  for (const { species } of tagsToRemove) {
    // Only remove if the tag exists, ignore if it doesn't exist
    if (currentTags.hasOwnProperty(species)) {
      const nameKey = `#tag${index}`;
      expressionAttributeNames[nameKey] = species;
      removeExpressions.push(`tags.${nameKey}`);
    }
    index++;
  }

  // Only perform update if there are tags to remove
  if (removeExpressions.length > 0) {
    const updateParams = {
      TableName: TABLE_NAME,
      Key: { file_id: fileId },
      UpdateExpression: `REMOVE ${removeExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
    };

    console.log("removeTagsFromFile updateParams", updateParams);

    await ddbDocClient.send(new UpdateCommand(updateParams));
  } else {
    console.log("No matching tags found to remove, operation ignored");
  }
}

async function sendNotification(fileId, fileType, tags, s3Url, thumbnailUrl, operation) {
  console.log("Sending notification for file:", fileId, "with tags:", tags, "and operation:", operation);
  
  await lambdaClient.send(new InvokeCommand({
    FunctionName: TAGS_NOTIFICATION_LAMBDA_ARN,
    InvocationType: "Event",
    Payload: JSON.stringify({
      fileId: fileId,
      fileType: fileType,
      tags: tags,
      s3Url: s3Url,
      thumbnailUrl: thumbnailUrl,
      operation: operation,
    }),
  }));
};

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    let requestBody;
    try {
      requestBody = event.body ? JSON.parse(event.body) : null;

      if (!requestBody || typeof requestBody !== 'object') {
        throw new Error("Empty or invalid request body");
      }
      // requestBody = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Invalid JSON in request body",
          details: "Please provide valid JSON",
        }),
      };
    }

    const { urls, operation, tags } = requestBody;

    // Validate request body
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing or invalid urls array",
          details: "Please provide an array of URLs",
        }),
      };
    }

    if (operation != 0 && operation != 1) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Invalid operation value",
          details: "Operation must be 0 (remove tags) or 1 (add tags)",
        }),
      };
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing or invalid tags object",
          details:
            'Please provide a tags object with species as keys and counts as values (e.g., {"crow": 2, "pigeon": 1})',
        }),
      };
    }

    // Validate tag format
    try {
      for (const tag of tags) {
        const [species, count] = tag.split(",");
        if (typeof species !== "string" || species.trim() === "") {
          throw new Error(
            `Invalid species name: "${species}". Species name must be a non-empty string`
          );
        }
        if (operation == 1) {
          if (
            !Number.isInteger(parseInt(count)) ||
            count <= 0
          ) {
            throw new Error(
              `Invalid count for tag "${species}": ${count}. Count must be a positive integer`
            );
          }
        }
      }
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Invalid tag format",
          details: error.message,
        }),
      };
    }

    const processedTags = tags.map((tag) => {
      const [species, count] = tag.split(",");
      return { species, count: parseInt(count) };
    });

    console.log(
      `${operation == 1 ? "Adding" : "Removing"} tags:`,
      tags,
      "to/from URLs:",
      urls
    );

    const results = {
      processed: [],
      notFound: [],
      errors: [],
    };

    // Process each URL
    for (const url of urls) {
      try {
        // Find the file in the database
        const file = await findFileByUrl(url);

        if (!file) {
          console.log("File not found in database for URL:", url);
          results.notFound.push(url);
          continue;
        }

        // Add or remove tags
        if (operation == 1) {
          await addTagsToFile(file.file_id, processedTags);
        } else {
          await removeTagsFromFile(file.file_id, processedTags);
        }

        results.processed.push(url);

        // Send notification to SNS
        await sendNotification(file.file_id, file.file_type, processedTags.map((tag) => tag.species), file.s3_url, file.thumbnail_url, operation);

        console.log(
          `Successfully ${operation === 1 ? "added" : "removed"} tags for:`,
          url
        );
      } catch (error) {
        console.error("Error processing URL:", url, error);
        results.errors.push(url);
      }
    }

    console.log("Tag operation results:", results);

    // Determine response status
    if (results.notFound.length === urls.length) {
      // All files were not found
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "All files specified in URLs not found",
          details: `Not found: ${results.notFound.join(", ")}`,
        }),
      };
    } else if (results.errors.length > 0) {
      // Some errors occurred
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Some files could not be processed",
          details: `Processed: ${results.processed.length}, Not found: ${results.notFound.length}, Errors: ${results.errors.length}`,
        }),
      };
    } else {
      // Success (either full or partial)
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Tags successfully updated",
          details: `Processed: ${results.processed.length}, Not found: ${results.notFound.length}`,
        }),
      };
    }
  } catch (error) {
    console.error("Error in tags-management function:", error);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error during tag operation",
        details: error.message,
      }),
    };
  }
};
