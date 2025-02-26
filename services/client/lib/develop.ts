import { serve } from "bun"
import client from "../src/index.html"

const server = serve({
  routes: {
    // Send the client otherwise.
    "/*": client,

    // Proxy API calls to the back-end.
    "/api": async (req) => {
      const url = new URL(req.url)
      url.port = "3001"
      url.pathname = url.pathname.replace(/^\/api/, "")
      try {
        return await fetch(url.toString(), {
          method: req.method,
          headers: req.headers,
          body: req.body,
        })
      } catch (error) {
        return Response.json({ error: "Service unavailable" }, { status: 504 })
      }
    },
    "/api/*": async (req) => {
      const url = new URL(req.url)
      url.port = "3001"
      url.pathname = url.pathname.replace(/^\/api/, "")
      try {
        return await fetch(url.toString(), {
          method: req.method,
          headers: req.headers,
          body: req.body,
        })
      } catch (error) {
        return Response.json({ error: "Service unavailable" }, { status: 504 })
      }
    },
  },

  // Enable development mode.
  development: true,
})

console.log(`Development server listening on ${server.url}`)
