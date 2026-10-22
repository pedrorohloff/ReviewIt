# ReviewIt API Reference

This document summarizes the REST API surface. For the interactive UI, run the app and visit:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

## Authentication

All endpoints require a valid Supabase JWT, except `GET /api/v1/health`, Swagger UI and the OpenAPI JSON. Send `Authorization: Bearer <token>`. The JWT `sub` (user ID) is extracted by `JwtFilter` and exposed as `@RequestAttribute("currentUserId")`.

The backend accepts RSA and ECDSA Supabase signing keys, caches the JWKS for five
minutes and refreshes it (at most once every 30 seconds) when an unknown `kid` is presented. Legacy HS256 shared
secrets are not accepted; use an asymmetric signing key and the public
`.well-known/jwks.json` endpoint.

## CORS

The frontend is deployed separately from the API. Browser origins must be listed
in `APP_CORS_ALLOWED_ORIGINS` (comma-separated; wildcards such as
`https://*.vercel.app` are supported). Authentication uses a bearer token, so
credentialed CORS is disabled. Preflight `OPTIONS` requests are allowed without a
token.

## Base Path

`/api/v1`

## Error Responses

Errors follow RFC 7807 (`ProblemDetail`):
- `404 Not Found` — `RecordNotFoundException`
- `403 Forbidden` — `ForbiddenException`
- `409 Conflict` — `BusinessException`
- `400 Bad Request` — Validation errors (`MethodArgumentNotValidException`) with `FieldValidationError` list

## Endpoints

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Public liveness probe; returns `{"status":"ok"}` |

### Profiles
| Method | Path | Description |
|---|---|---|
| GET | `/profiles?page={page}&pageSize={pageSize}` | List profiles (paginated) |
| GET | `/profiles/{id}` | Get profile by id |
| POST | `/profiles` | Create profile |
| PUT | `/profiles/{id}` | Update profile |
| DELETE | `/profiles/{id}` | Delete profile |

### Posts
| Method | Path | Description |
|---|---|---|
| GET | `/posts?page={page}&pageSize={pageSize}` | List posts (paginated); accepts optional query params below |
| GET | `/posts/{id}` | Get post by id |
| POST | `/posts` | Create post |
| PUT | `/posts/{id}` | Update post |
| DELETE | `/posts/{id}` | Delete post |
| PATCH | `/posts/{id}/notification-settings` | Update notification settings for post |

`GET /posts` optional query params (all combinable, applied to the whole dataset):

| Param | Values | Default | Notes |
|---|---|---|---|
| `q` | free text | – | Case-insensitive search over `title` OR `content`; `%`/`_` are escaped |
| `contentType` | `Book` \| `Movie` \| `Album` \| `Game` | – | Invalid value → `400` |
| `genre` | `Action` \| `Romance` \| `Horror` \| `Comedy` \| `Drama` | – | Invalid value → `400` |
| `sort` | `recent` \| `popular` | `recent` | `recent` = `createdAt DESC`; `popular` = `likeCount DESC`, invalid value → `400` |
| `authorId` | UUID | – | Filter posts by author |

Every `PostDTO` returned by these endpoints now carries real `likeCount`/`commentCount`
(batched, one grouped query per page — no N+1) and `likedByMe` (derived from the JWT
`sub`; `false` for anonymous requests).

### Comments
| Method | Path | Description |
|---|---|---|
| GET | `/posts/{postId}/comments?page={page}&pageSize={pageSize}` | List comments for post (paginated) |
| GET | `/comments/{id}` | Get comment by id |
| POST | `/posts/{postId}/comments` | Create comment on post |
| PUT | `/comments/{id}` | Update comment |
| DELETE | `/comments/{id}` | Delete comment |

Comments are ordered oldest first (`createdAt`, then `id`) so pages are stable. Every
`CommentDTO` now carries real `likeCount` (batched per page) and `likedByMe` (from the
JWT `sub`; `false` for anonymous requests). `GET /posts/{id}` exposes the same real
`commentCount` that this list totals.

### Likes
| Method | Path | Description |
|---|---|---|
| POST | `/posts/{postId}/like` | Toggle like on post (returns `ToggleLikeDTO`) |
| POST | `/comments/{commentId}/like` | Toggle like on comment (returns `ToggleLikeDTO`) |

### Moderation & Reports
| Method | Path | Description |
|---|---|---|
| POST | `/reports` | Create report |
| GET | `/reports?page={page}&pageSize={pageSize}&status={Pending\|Resolved}` | List reports (paginated, optional status filter; moderators/admins only) |
| POST | `/reports/{reportId}/action` | Apply moderation action |

### Notifications
| Method | Path | Description |
|---|---|---|
| GET | `/notifications?page={page}&pageSize={pageSize}` | List notifications for current user (paginated) |
| PATCH | `/notifications/{id}/read` | Mark notification as read |

## Response Examples

### 404 Not Found (ProblemDetail)
```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Post not found with id: 123e4567-e89b-12d3-a456-426614174000"
}
```

### 400 Validation Error (ProblemDetail with extensions)
Validation errors include field details via `FieldValidationError`.

## Notes
- All `currentUserId` values come from the authenticated user's JWT `sub` claim.
- Pagination uses `page` (0-based) and `pageSize` query params.
- Like endpoints are idempotent toggles (like/unlike).