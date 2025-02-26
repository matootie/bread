# Bun Layer

A custom Lambda layer for Bun runtime.

This is based heavily on the provided one by [Bun](https://github.com/oven-sh/bun/tree/main/packages/bun-lambda) but it doesn't do any kind of conversion of AWS event data into a Request object.

This allows Hono to properly handle requests using `hono/aws-lambda`.
