import * as cdk from 'aws-cdk-lib';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/util";
import { movies } from "../seed/movies";



import { Construct } from 'constructs';

export class SimpleAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 创建 Lambda
    const simpleFn = new lambdanode.NodejsFunction(this, "SimpleFn", {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: `${__dirname}/../lambdas/simple.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    // 添加 Function URL（公开访问）
    const simpleFnURL = simpleFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // 公开访问
      cors: {
        allowedOrigins: ["*"], // 允许所有来源
      },
    });

    // 输出 URL
    new cdk.CfnOutput(this, "Simple Function Url", { value: simpleFnURL.url });

    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // 按请求收费（无需预置容量）
      partitionKey: { name: "id", type: dynamodb.AttributeType.NUMBER }, // 主键
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 允许删除
      tableName: "Movies", // 指定表名

    });
    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn],
      }),
    });

    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
    );
    
    // 让 Lambda 通过 HTTP 访问
    const getMovieByIdURL = getMovieByIdFn.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE, // 公开访问
      cors: {
        allowedOrigins: ["*"], // 允许所有前端应用请求
      },
    });
    
    // 允许 Lambda 读取 DynamoDB 数据
    moviesTable.grantReadData(getMovieByIdFn);
    
    // 输出 Function URL
    new cdk.CfnOutput(this, "Get Movie Function Url", { value: getMovieByIdURL.url });
    
    
  }
}
