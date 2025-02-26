/**
 * Custom Bun runtime.
 */

// Keep track of a few contexts.
let requestId: string | undefined
let traceId: string | undefined
let functionArn: string | undefined

/**
 * Function to reset the runtime.
 *
 * Normally this runtime script will keep track of request ID and trace ID.
 * This function will clear those values.
 */
function reset(): void {
  requestId = undefined
  traceId = undefined
}

/**
 * Fully exit the runtime process for some reason.
 */
function exit(...cause: any[]): never {
  console.error(...cause)
  process.exit(1)
}

/**
 * Wrapper function to get an environment variable value or fail.
 */
function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback ?? null
  if (value === null) {
    exit(`Runtime failed to find the '${name}' environment variable`)
  }
  return value
}

// The base runtime URL for Lambda API environment.
const runtimeUrl = new URL(
  `http://${env("AWS_LAMBDA_RUNTIME_API")}/2018-06-01/`
)

/**
 * Easy function to call Lambda API.
 */
async function fetch(url: string, options?: RequestInit): Promise<Response> {
  const { href } = new URL(url, runtimeUrl)
  console.log(`fetch ${href}`)
  const response = await globalThis.fetch(href, {
    ...options,
  })
  if (!response.ok) {
    exit(
      `Runtime failed to send request to Lambda [status: ${response.status}]`
    )
  }
  return response
}

/**
 * Function to format any error.
 */
function formatError(error: unknown): {
  readonly errorType: string
  readonly errorMessage: string
  readonly stackTrace?: string[]
} {
  if (error instanceof Error) {
    return {
      errorType: error.name,
      errorMessage: error.message,
      stackTrace: error.stack
        ?.split("\n")
        .filter((line) => !line.includes(" /opt/runtime.ts")),
    }
  }
  return {
    errorType: "Error",
    errorMessage: Bun.inspect(error),
  }
}

/**
 * Function to send error details to the Lambda API.
 */
async function sendError(type: string, cause: unknown): Promise<void> {
  console.error(cause)
  await fetch(
    requestId === undefined
      ? "runtime/init/error"
      : `runtime/invocation/${requestId}/error`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.aws.lambda.error+json",
        "Lambda-Runtime-Function-Error-Type": `Bun.${type}`,
      },
      body: JSON.stringify(formatError(cause)),
    }
  )
}

/**
 * Function to throw an error.
 */
async function throwError(type: string, cause: unknown): Promise<never> {
  await sendError(type, cause)
  exit()
}

/**
 * Initialize the handler.
 */
async function init(): Promise<(event: any, context: any) => Promise<any>> {
  // Parse the details for the handler.
  const handlerName = env("_HANDLER")
  const index = handlerName.lastIndexOf(".")
  const fileName = handlerName.substring(0, index)
  const filePath = `${env("LAMBDA_TASK_ROOT")}/${fileName}`

  console.log(`handlerName: ${handlerName}`)
  console.log(`fileName: ${fileName}`)
  console.log(`filePath: ${filePath}`)

  // Try and load the file.
  let file
  try {
    file = await import(filePath)
  } catch (cause) {
    if (
      cause instanceof Error &&
      cause.message.startsWith("Cannot find module")
    ) {
      return throwError(
        "FileDoesNotExist",
        `Did not find a file named '${fileName}'`
      )
    }
    return throwError("InitError", cause)
  }

  // Try and load the handler.
  const moduleName = handlerName.substring(index + 1) || "handler"
  let module = file[moduleName] ?? {}

  console.log(`module: ${module}`)

  // Return the handler function.
  return module
}

type LambdaRequest<E = any> = {
  readonly requestId: string
  readonly traceId: string
  readonly functionArn: string
  readonly deadlineMs: number | null
  readonly event: E
}

/**
 * Receive a new request to execute a Lambda event.
 */
async function receiveRequest(): Promise<LambdaRequest> {
  // Get the next invocation (may hang for a while).
  const response = await fetch("runtime/invocation/next")

  // Apply the request ID.
  requestId = response.headers.get("Lambda-Runtime-Aws-Request-Id") ?? undefined
  if (requestId === undefined) {
    exit("Runtime received a request without a request ID")
  }

  // Apply the trace ID.
  traceId = response.headers.get("Lambda-Runtime-Trace-Id") ?? undefined
  if (traceId === undefined) {
    exit("Runtime received a request without a trace ID")
  }
  process.env["_X_AMZN_TRACE_ID"] = traceId

  // Apply the function ARN.
  functionArn =
    response.headers.get("Lambda-Runtime-Invoked-Function-Arn") ?? undefined
  if (functionArn === undefined) {
    exit("Runtime received a request without a function ARN")
  }

  // Get the deadline for function to execute.
  const deadlineMs =
    parseInt(response.headers.get("Lambda-Runtime-Deadline-Ms") ?? "0") || null

  // Apply the event details.
  let event
  try {
    event = await response.json()
  } catch (cause) {
    exit("Runtime received a request with invalid JSON", cause)
  }

  // Return all the received details.
  return {
    requestId,
    traceId,
    functionArn,
    deadlineMs,
    event,
  }
}

/**
 * Function to send a response to the Lambda API.
 */
async function sendResponse(response: unknown): Promise<void> {
  if (requestId === undefined) {
    exit("Runtime attempted to send a response without a request ID")
  }
  await fetch(`runtime/invocation/${requestId}/response`, {
    method: "POST",
    body:
      response === null
        ? null
        : typeof response === "string"
          ? response
          : JSON.stringify(response),
  })
}

const handler = await init()
while (true) {
  try {
    // Get the details of the next Lambda invocation.
    const request = await receiveRequest()

    // Calculate the allowed runtime duration.
    const deadlineMs =
      request.deadlineMs === null ? Date.now() + 60_000 : request.deadlineMs
    const durationMs = Math.max(1, deadlineMs - Date.now())

    // Run the handler code.
    let response
    try {
      // Race against the clock!
      response = await Promise.race([
        new Promise<undefined>((resolve) => setTimeout(resolve, durationMs)),
        // TODO: maybe actually include Lambda context...
        handler(request.event, undefined),
      ])
      if (response !== undefined) {
        // Send the response if there's any.
        await sendResponse(response)
      } else {
        // Otherwise we have timed out.
        await sendError("TimeoutError", "Function timed out")
      }
    } catch (cause) {
      // In case of any errors, share.
      await sendError("RequestError", cause)
    }
  } finally {
    // Reset the runtime context.
    reset()
  }
}
