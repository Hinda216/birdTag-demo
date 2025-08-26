import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const S3_BUCKET = process.env.S3_BUCKET_NAME;

// Extract S3 key from S3 URL
function extractS3KeyFromUrl(s3Url) {
  try {
    const url = new URL(s3Url);
    // Remove leading slash from pathname
    return url.pathname.substring(1);
  } catch (error) {
    console.error("Error parsing S3 URL:", s3Url, error);
    return null;
  }
}

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

// Delete file from S3
async function deleteFromS3(s3Url) {
  const s3Key = extractS3KeyFromUrl(s3Url);
  if (!s3Key) {
    console.error("Could not extract S3 key from URL:", s3Url);
    return false;
  }

  try {
    const deleteParams = {
      Bucket: S3_BUCKET,
      Key: s3Key,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
    console.log("Successfully deleted from S3:", s3Key);
    return true;
  } catch (error) {
    if (error.name === "NoSuchKey") {
      console.log("File not found in S3 (already deleted?):", s3Key);
      return true; // Consider this a success since the file is already gone
    }
    console.error("Error deleting from S3:", s3Key, error);
    return false;
  }
}

// Delete file record from DynamoDB
async function deleteFromDatabase(fileId) {
  try {
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: {
        file_id: fileId,
      },
    };

    await ddbDocClient.send(new DeleteCommand(deleteParams));
    console.log("Successfully deleted from database:", fileId);
    return true;
  } catch (error) {
    console.error("Error deleting from database:", fileId, error);
    return false;
  }
}

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Invalid JSON in request body",
          details: "Please provide valid JSON with urls array",
        }),
      };
    }

    if (
      !requestBody.urls ||
      !Array.isArray(requestBody.urls) ||
      requestBody.urls.length === 0
    ) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Missing or invalid urls array",
          details: "Please provide an array of URLs to delete",
        }),
      };
    }

    const urlsToDelete = requestBody.urls;
    console.log("URLs to delete:", urlsToDelete);

    const results = {
      deleted: [],
      notFound: [],
      errors: [],
    };

    // Process each URL
    for (const url of urlsToDelete) {
      try {
        // Find the file in the database
        const file = await findFileByUrl(url);

        if (!file) {
          console.log("File not found in database for URL:", url);
          results.notFound.push(url);
          continue;
        }

        let allDeleted = true;

        // Delete from S3 - both main file and thumbnail if it exists
        if (file.s3_url) {
          const s3Deleted = await deleteFromS3(file.s3_url);
          if (!s3Deleted) {
            allDeleted = false;
          }
        }

        if (file.thumbnail_url && file.thumbnail_url !== file.s3_url) {
          const thumbnailDeleted = await deleteFromS3(file.thumbnail_url);
          if (!thumbnailDeleted) {
            allDeleted = false;
          }
        }

        // Delete from database
        const dbDeleted = await deleteFromDatabase(file.file_id);
        if (!dbDeleted) {
          allDeleted = false;
        }

        if (allDeleted) {
          results.deleted.push(url);
        } else {
          results.errors.push(url);
        }
      } catch (error) {
        console.error("Error processing URL:", url, error);
        results.errors.push(url);
      }
    }

    console.log("Deletion results:", results);

    // Determine response status
    if (results.deleted.length === urlsToDelete.length) {
      // All files deleted successfully
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
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
          message: "Some files could not be deleted",
          details: `Deleted: ${results.deleted.length}, Not found: ${results.notFound.length}, Errors: ${results.errors.length}`,
        }),
      };
    } else {
      // No errors occurred (files were deleted or not found)
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    }
  } catch (error) {
    console.error("Error in images-delete function:", error);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error during file deletion",
        details: error.message,
      }),
    };
  }
};
