# Full-Stack Serverless Bun Template

A full template for a serverless application built using Bun.

Features:

- AWS CDK for infrastructure-as-code to define Cloud resources. (`packages/cdk`)
- Custom Lambda Layer for Bun that plays nicely with Hono. (`packages/bun-layer`)
- Lambda based API using Hono. (`services/api`)
- Static-hosted web application using React. (`services/client`)
- Everything is neatly configured behind a CloudFront distribution (`packages/cdk`)

How to use:

- `bun run develop` will start the development server.
- `bun run build` will bundle all code and CDK definitions.
- `bun run package` will zip up all code to deploy.
- `bun cdk [...]` alias for aws-cdk CLI in the correct working directory.
- `bun cdk synth` will synthesize a CloudFormation template.
- `bun cdk diff` will show a diff between deployed CloudFormation state and local changes.
- `bun cdk deploy` will deploy the application to AWS.

### Development Server

The development server will hot-reload client changes. When using `bun run develop` the API server will also restart when changes are made.

Additionally, there's a proxy available in the development server that mimicks the CloudFront configuration. Any requests made to `/api` or `/api/*` will be forwarded to the API server locally. This way, you can hard code in your API request URLs in the client without worrying about local/deployed servers.
