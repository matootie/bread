import * as cdk from "aws-cdk-lib"
import * as cf from "aws-cdk-lib/aws-cloudfront"
import * as lambda from "aws-cdk-lib/aws-lambda"
import * as origins from "aws-cdk-lib/aws-cloudfront-origins"
import * as s3deployment from "aws-cdk-lib/aws-s3-deployment"

import { ApiConstruct } from "@app/api"
import { ClientConstruct } from "@app/client"

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Create the API construct.
    const api = new ApiConstruct(this, "Api", {
      layerZip: "../../packages/bun-layer/out/layer.zip",
      appZip: "../../services/api/out/app.zip",
    })

    // Create the Client construct.
    const client = new ClientConstruct(this, "Client")

    // Create the redirect lambda.
    const redirect = new cf.experimental.EdgeFunction(
      this,
      "RedirectFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "redirect.handler",
        code: lambda.Code.fromAsset("out/redirect.zip"),
      }
    )

    // Create the CloudFront Origin for the API.
    const apiOrigin = new origins.RestApiOrigin(api.gateway)

    // Create the CloudFront Origin for the Bucket.
    const clientOrigin = origins.S3BucketOrigin.withOriginAccessControl(
      client.bucket
    )

    // Create the CloudFront Distribution.
    const distribution = new cf.Distribution(this, "Distribution", {
      comment: "Bun",
      defaultBehavior: {
        origin: clientOrigin,
        allowedMethods: cf.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cf.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas: [
          {
            functionVersion: redirect.currentVersion,
            eventType: cf.LambdaEdgeEventType.ORIGIN_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        "/api": {
          origin: apiOrigin,
          allowedMethods: cf.AllowedMethods.ALLOW_ALL,
          cachePolicy: cf.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy:
            cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        "/api/*": {
          origin: apiOrigin,
          allowedMethods: cf.AllowedMethods.ALLOW_ALL,
          cachePolicy: cf.CachePolicy.CACHING_DISABLED,
          viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          originRequestPolicy:
            cf.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
      },
    })

    // Create the bucket deployment.
    new s3deployment.BucketDeployment(this, "ClientDeployment", {
      destinationBucket: client.bucket,
      sources: [
        s3deployment.Source.asset("../../services/client/out/client.zip"),
      ],
      distribution,
      distributionPaths: ["/*"],
    })

    // Output the Distribution URL.
    // new cdk.CfnOutput(this, `${id}-DeploymentUrl`, {
    //   exportName: "deploymentUrl",
    //   description: "The base URL of the deployment",
    //   value: distribution.domainName,
    // })
  }
}
