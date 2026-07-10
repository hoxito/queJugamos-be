# Search behavior

`GET /api/v1/games` and `POST /api/v1/games/query` are the source of truth for catalog filtering, ordering and pagination.

Client applications must send the selected filters to the backend and render the paginated response they receive. They must not fetch a generic page and then apply material filtering locally, because that hides valid games that live on later pages and makes `total` and `hasNextPage` misleading.

## Material search contract

When `materialIds` or `materialSlugs` are present:

- The backend filters against the full approved catalog before pagination.
- A game is a candidate when at least one of its required materials matches the selected materials.
- Candidates are ordered by number of matching required materials, descending.
- Ties are ordered by rating average, descending, then creation date, descending.
- Pagination is applied only after that filtered and ordered result set is built.

Example: a request with `materialSlugs: ["paper", "pen"]` returns games that require paper or pen, with games requiring both paper and pen before games requiring only one of them.

Frontend, mobile clients and future API gateway consumers should rely on this backend order. If a client needs local UI grouping or highlighting, it can do that on the received page, but it must not change which games qualify for the page.

## Other filters

Text, players, age, difficulty and outdoor filters are also backend filters. They are combined with material filters before ordering and pagination.
