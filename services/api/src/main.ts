import app from "./app"

const server = Bun.serve({
  port: 3002,
  fetch: app.fetch,
})

console.log(`Listening on http://localhost:${server.port}`)
