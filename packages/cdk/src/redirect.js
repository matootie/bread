const { parse } = require("path")

const handler = async (event, _context, callback) => {
  const { request } = event.Records[0].cf
  const parsed = parse(request.uri)
  if (parsed.ext === "") {
    request.uri = "/index.html"
  }
  return callback(null, request)
}

module.exports = { handler }
