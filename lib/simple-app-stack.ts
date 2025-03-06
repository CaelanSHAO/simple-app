import * as cdk from 'aws-cdk-lib';
import * as lambdanode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

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
  }
}
