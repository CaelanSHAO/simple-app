import { Handler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

// 创建 DynamoDB 客户端
const ddbDocClient = createDDbDocClient();

export const handler: Handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));

    // 解析查询参数 movieId
    const queryString = event?.queryStringParameters;
    const movieId = queryString ? parseInt(queryString.movieId) : undefined;

    if (!movieId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    // 查询 DynamoDB
    const commandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id: movieId },
      })
    );

    if (!commandOutput.Item) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Invalid movie Id" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: commandOutput.Item }),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error }),
    };
  }
};

// 创建 DynamoDB 客户端
function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  return DynamoDBDocumentClient.from(ddbClient);
}
