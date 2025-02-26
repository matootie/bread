/**
 * AWS CDK stack.
 */

import * as lambda from "aws-cdk-lib/aws-lambda"
import { RemovalPolicy } from "aws-cdk-lib/core"
import { Construct } from "constructs"

export class BunLayerConstruct extends Construct {
  layer: lambda.LayerVersion

  constructor(scope: Construct, id: string, { zipFile }: { zipFile: string }) {
    super(scope, id)

    // Create the Bun layer.
    this.layer = new lambda.LayerVersion(this, "BunLayer", {
      removalPolicy: RemovalPolicy.DESTROY,
      code: lambda.Code.fromAsset(zipFile),
      compatibleArchitectures: [lambda.Architecture.ARM_64],
    })
  }
}
