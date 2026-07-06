# HTTP QUERY

`QUERY` is an emerging HTTP method intended for safe, cacheable queries with request bodies. It is interesting for complex searches because it avoids overloaded GET query strings and avoids semantically using POST for a read.

For this project, the backend keeps the stable production endpoint as:

```http
POST /api/v1/games/query
```

Reason:

- NestJS standard decorators do not expose `QUERY` as a first-class method.
- Express/Fastify adapters, mobile clients, proxies, tunnels and API gateways may not consistently forward unknown methods.
- The frontend is React Native/Expo, where portable networking matters more than method novelty.

If the ecosystem support becomes reliable, we can add `QUERY /api/v1/games` as an optional alias without changing the query service or DTOs.
