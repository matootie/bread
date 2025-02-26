import * as s3 from "aws-cdk-lib/aws-s3"
import { Construct } from "constructs"

export class ClientConstruct extends Construct {
  bucket: s3.Bucket

  constructor(scope: Construct, id: string) {
    super(scope, id)

    // Create the bucket.
    this.bucket = new s3.Bucket(this, "ClientBucket", {
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    })
  }
}
