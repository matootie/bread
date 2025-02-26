import * as lambda from "aws-cdk-lib/aws-lambda"
import * as apigw from "aws-cdk-lib/aws-apigateway"
import { Construct } from "constructs"

import { BunLayerConstruct } from "@app/bun-layer"

export class ApiConstruct extends Construct {
  lambda: lambda.Function
  gateway: apigw.LambdaRestApi

  constructor(
    scope: Construct,
    id: string,
    { layerZip, appZip }: { layerZip: string; appZip: string }
  ) {
    super(scope, id)

    // Reference the Bun layer.
    const bun = new BunLayerConstruct(this, "BunLayer", { zipFile: layerZip })

    // Create the API lambda
    this.lambda = new lambda.Function(this, "ApiFunction", {
      runtime: lambda.Runtime.PROVIDED_AL2,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(appZip),
      architecture: lambda.Architecture.ARM_64,
      layers: [bun.layer],
      environment: {
        NODE_ENV: "production",
        LOG_LEVEL: "debug",
      },
    })

    // Create the API gateway
    this.gateway = new apigw.LambdaRestApi(this, "ApiGateway", {
      handler: this.lambda,
    })
  }
}
