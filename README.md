# Celonica Public Portal

The main Celonica app's **GN page** and **industry survey**, ripped as they are, with authentication removed. Same code, same logic, same database.

- GN page: `/gnpage`, `/gnpage/:gnName/:ccode`, `/gnpage/:gnName/:ccode/:categorySlug`
- Industry survey: `/industry-survey`, `/industry-survey/:gnName/:ccode`

## Run

1. Start the main stack first (`docker compose up -d` in `Celonica_DATAFORM-WEB`). The portal uses its PostgreSQL, Redis and network.
2. `cp .env.example .env`, then set:
   - `APP_KEY` (generate a new one);
   - `DB_USERNAME`/`DB_PASSWORD` (the main app's database user);
   - `TEXTWARE_*` (the main app's SMS settings).
3. `docker compose up -d --build`, then open <http://localhost:3002>.

To run the frontend in development: `cd frontend && npm install --legacy-peer-deps && npm run dev`. It serves <http://localhost:5175> and proxies `/api` and `/graphql` to :3002.

## What was copied, what was changed

Every file was copied from `Celonica_DATAFORM-WEB` unchanged, except the 11 below. The only edits are removing authentication and limiting the app to these two pages.

| File | Change |
|---|---|
| `backend/app/Http/Controllers/IndustrySurveyController.php` | removed the two "signed-in account required" (401) checks in `store()` and `generateRegNumber()` |
| `backend/config/lighthouse.php` | removed `KeycloakAuthGuard` from the GraphQL middleware |
| `backend/bootstrap/app.php` | removed the Keycloak middleware aliases |
| `backend/routes/api.php` | only the routes these two pages call, with the same controllers and throttles; `keycloak.admin` removed |
| `backend/graphql/schema.graphql` | only the 7 queries these pages use and their types, copied verbatim; admin queries and mutations left out |
| `frontend/src/auth/AuthProvider.tsx` | Keycloak replaced by an always-signed-out provider with the same `useAuth()` interface; Login and Join open the main app (`VITE_MAIN_APP_URL`) |
| `frontend/src/api/apolloClient.ts` | removed the Keycloak and guest-token auth link |
| `frontend/src/pages/IndustrySurveyPage.tsx` | removed the "Login Required" popup, the redirect to login, and the `Authorization` header |
| `frontend/src/App.tsx` | only the GN page and survey routes |
| `frontend/vite.config.ts`, `frontend/nginx.conf` | port 5175 and API host `portal-api` |

The backend runs with the main app's environment: the same database user, the same Redis, and the same `APP_NAME` (so the cache prefix is the same). Caches, OTP codes and rate limits are therefore shared, as if the portal were another replica of the main backend.

## Behaviour that follows from removing authentication

The survey logic is unchanged, so anonymous surveys are saved with `user_id` and `created_by` empty. The original ownership check lets any caller update an anonymous draft whose id they send. Submission still requires the phone OTP verification, exactly as in the main app.
