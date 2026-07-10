# Error responses

Every API error response must use Problem Details for HTTP APIs as defined by RFC 9457.

The response content type is:

```text
application/problem+json
```

The standard response shape is:

```json
{
  "type": "about:blank",
  "title": "BAD REQUEST",
  "status": 400,
  "detail": "Request validation failed.",
  "instance": "/api/v1/games",
  "errors": [
    "title should not be empty"
  ]
}
```

Required members:

- `type`: problem type URI. Use `about:blank` for generic HTTP errors.
- `title`: short human-readable summary.
- `status`: HTTP status code, matching the actual response status.
- `detail`: human-readable detail for this occurrence.
- `instance`: request path for this occurrence.

Validation errors use the `errors` extension member with the validation details.

Known Prisma errors are translated before returning a response. Unique constraint conflicts such as creating an already existing slug or email return `409 Conflict` instead of `500`, and missing records return `404 Not Found`.

Backend errors are always logged to the NestJS terminal logger. Set `BACKEND_ERROR_LOG_FILE` to also append JSON lines to a local file when Codex or another tool cannot read the terminal output reliably.

Reference: https://www.rfc-editor.org/info/rfc9457/
