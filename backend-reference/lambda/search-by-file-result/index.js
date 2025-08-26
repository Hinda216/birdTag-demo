import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const LAMBDA_FUNCTION_ARN = process.env.LAMBDA_FUNCTION_ARN;

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const filename = queryParams.filename;


    const response = await dynamoDbClient.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: {
          s3_url: {'S': filename},
        },
      })
    );



    if (!response.Item) {

      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "File not found",
          details: "No file found with the provided s3_url",
        }),
      };
    }

    console.log("DynamoDB response:", response)

    const item = unmarshall(response.Item);
    console.log("Item:", item)

    if (item.status === 'error') {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Processing Error",
          details: "Please try again later, or contact support",
        }),
      };
    }

    if (item.status === 'pending') {
      // make sure file is uploaded to s3
      const s3Client = new S3Client({ region: process.env.AWS_REGION });
      try {
        const s3Response = await s3Client.send(new GetObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: "tmp/" + filename,
        }));
        console.log("S3 response:", s3Response);
      } catch (error) {
        return {
          statusCode: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          body: JSON.stringify({
            message: "File not found",
            details: "Please upload the file again",
          }),
        };        
      }

      const invokeResponse = await lambdaClient.send(new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_ARN,
        InvocationType: 'Event',
        Payload: JSON.stringify({
          s3_url: filename,
        }),
      }));
      console.log("Invoke response:", invokeResponse);
      
      const updateResponse = await dynamoDbClient.send(
        new UpdateItemCommand({
          TableName: TABLE_NAME,
          Key: { s3_url: {'S': filename} },
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': {'S': 'processing'} },
        })
      );
      console.log("Update response:", updateResponse);
    } 

    if (item.status !== 'done') {
      return {
        statusCode: 100,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Processing in progress",
          details: "Please try again later",
        }),
      };
    }


    const result = item.tags;
    console.log("Result:", result)

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error in search-by-file-result function:", error);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Internal server error while retrieving search results",
        details: error.message,
      }),
    };
  }
};
