import * as cdk from "aws-cdk-lib"
import { CdkStack } from "../lib/cdk.stack"

const app = new cdk.App()
new CdkStack(app, "BunStack", {
  description: "This stack is used to deploy resources for a Bun application.",
  env: {
    region: "us-east-1",
  },
})
