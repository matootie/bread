# API

The back-end API for this web application.

It's a Hono API. There is a custom CDK definition in `lib/stack.ts` where you can define any additional resources required for the API.

My personal suggestion is that you use this API as a _"back-end for front-end"_ and call any other downstream services to aggregate data, rather than beefing up this API with a ton of business logic. Partly for simplicity, but also on account of this entire API being bundled into one Lambda.
