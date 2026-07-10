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

Known Prisma errors are translated before returning a response. The mapping lives in
`src/common/prisma/prisma-errors.ts` so Prisma codes are not compared as magic strings in filters or services.

| Constant | Prisma code | HTTP status | Meaning |
| --- | --- | --- | --- |
| `PrismaKnownErrorCode.UniqueConstraintFailed` | `P2002` | `409 Conflict` | A unique field such as a slug or email already exists. |
| `PrismaKnownErrorCode.RecordNotFound` | `P2025` | `404 Not Found` | The requested record does not exist. |

Backend errors are always logged to the NestJS terminal logger. Set `BACKEND_ERROR_LOG_FILE` to also append JSON lines to a local file when Codex or another tool cannot read the terminal output reliably.

Reference: https://www.rfc-editor.org/info/rfc9457/
