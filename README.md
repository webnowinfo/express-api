# forum-science

REST API for the forum and science databases. It provides role-based authentication on the
existing `user_info` / `user_permission` tables and create/read/update/delete endpoints for every
table in both MySQL databases:

| Database     | Tables | Served at                                                                 |
| ------------ | ------ | ------------------------------------------------------------------------- |
| `kcc_main`   | 73     | `/v1/main/<table>` (70); `user_info` and `user_permission` via `/v1/users` and `/v1/auth`; `data_recording_text` has no primary key and no endpoints |
| `science_db` | 34     | `/v1/science/<table>` (all 34)                                            |

Stack: Node.js 20, TypeScript 5.9, Express 5, Prisma 6, MySQL 8, Passport JWT, Joi, Jest,
Swagger UI.

## Requirements

- **Node.js 20.19 or newer 20.x.** With Laragon it lives at `C:\laragon\bin\nodejs\node-v20.20.2`;
  put that folder on your PATH (or pick it in Laragon's Node.js menu and use Laragon's terminal).
- **Yarn 1.** Run `corepack enable` once, or use `corepack yarn@1.22.22 <command>`.
- **MySQL 8** (Laragon's MySQL 8.4 works) with the two databases below.

## Setup

1. Create the databases and load the schemas (structure only, no data). The SQL files were
   transcribed from the printed schema report and are the source of truth for the table layout.

   ```bash
   mysql -u root -e "CREATE DATABASE kcc_main CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE science_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root kcc_main < prisma/sql/kcc_main.schema.sql
   mysql -u root science_db < prisma/sql/science_db.schema.sql
   ```

2. Configure the environment:

   ```bash
   cp .env.example .env
   ```

   | Variable                        | Meaning                                          |
   | ------------------------------- | ------------------------------------------------ |
   | `PORT`                          | HTTP port (default 3000)                         |
   | `DATABASE_URL`                  | `mysql://user:password@host:3306/kcc_main`       |
   | `DATABASE_URL_SCIENCE`          | `mysql://user:password@host:3306/science_db`     |
   | `JWT_SECRET`                    | Token signing secret. **Change it** for any real deployment. |
   | `JWT_ACCESS_EXPIRATION_MINUTES` | Access token lifetime (default 30)               |
   | `JWT_REFRESH_EXPIRATION_DAYS`   | Refresh token lifetime (default 30)              |

3. Install and create the first admin:

   ```bash
   yarn install
   yarn create-admin <userName> <password> [departID] [posID] [birthday YYYY-MM-DD]
   ```

4. Run it:

   ```bash
   yarn dev
   ```

   API status: `http://localhost:3000/v1` · Swagger UI: `http://localhost:3000/v1/docs` (development only)
   · OpenAPI JSON: `/v1/docs/openapi.json`

## Scripts

| Command                       | What it does                                                         |
| ----------------------------- | -------------------------------------------------------------------- |
| `yarn dev`                    | Start with auto-reload (`NODE_ENV=development`, Swagger UI enabled) |
| `yarn build`                  | Compile `src/` to `build/`                                           |
| `yarn start`                  | Build, then run `build/src/index.js` under PM2 in production mode    |
| `yarn test`                   | Run all tests (no database needed)                                   |
| `yarn test:coverage`          | Tests with a coverage report in `coverage/`                          |
| `yarn lint` / `yarn lint:fix` | ESLint (+ Prettier rules)                                            |
| `yarn prettier`               | Check formatting                                                     |
| `yarn create-admin`           | Create an approved admin account                                     |
| `yarn db:pull`                | Re-read both database schemas into Prisma and regenerate the clients |
| `yarn db:generate`            | Regenerate both Prisma clients                                       |
| `yarn db:studio` / `yarn db:studio:science` | Browse the databases with Prisma Studio                |

## Authentication and roles

Roles come from flags on `user_info`; there is no role column:

| Role      | Stored as             | Can do                                                                  |
| --------- | --------------------- | ----------------------------------------------------------------------- |
| ADMIN     | `isAdmin = 1`         | Everything, including user management                                   |
| LIBRARIAN | `isLibrarian = 1`     | Read non-sensitive tables, create/update/delete `book_*` tables          |
| USER      | neither               | Read non-sensitive tables, view and edit own profile                    |

Flow:

1. `POST /v1/auth/register` creates a **pending** account (login is refused until approved).
2. An admin approves it with `PATCH /v1/users/:id/status` (`approved`; also `suspended`,
   `retired`, `pending`) and sets the role with `PATCH /v1/users/:id/role`.
3. `POST /v1/auth/login` (`userName` + `password`) returns an access token and a refresh token.
   Send `Authorization: Bearer <access token>`; renew with `POST /v1/auth/refresh-tokens`.
4. `GET /v1/auth/me` returns the user, role, named rights, read/write access for every table and
   the user's `user_permission` values, so a client can show only what the user may use.
5. `POST /v1/auth/change-password` changes the own password; `POST /v1/auth/logout` ends the
   session.

Details:

- Tokens are stateless JWTs. Logout sets `user_info.isLogin = 0`, which invalidates **all** of that
  user's tokens (every device). Suspended or retired accounts are rejected immediately.
- Passwords are stored with bcrypt. Logins also accept legacy unsalted MD5/SHA1/SHA256/SHA512 hex
  hashes and PHP `$2y$` bcrypt; legacy hashes are re-saved as bcrypt after a successful login.
- Nobody can change their own role, status or permissions, and the last approved admin cannot be
  demoted, suspended or deleted.
- Login and registration are rate-limited in production (20 failed attempts per 15 minutes).

User endpoints (`/v1/users`): list/create (admin), get/update/delete (admin, or the user for their
own account; users cannot change `isAdmin`, `isLibrarian`, `status`, `departID`, `posID`),
`/:id/role`, `/:id/status`, and `GET`/`PUT /:id/permissions` for `user_permission` (ID lists are
read as `1,5,12` or `[1,5,12]` and saved as `1,5,12`).

## Table endpoints

Every other table gets the same five endpoints, generated from Prisma's model metadata:

| Method   | Path                    | Notes                                                       |
| -------- | ----------------------- | ----------------------------------------------------------- |
| `GET`    | `/v1/<db>/<table>`      | `page`, `limit` (max 100), `sortBy`, `sortType`, plus `<column>=<value>` exact-match filters |
| `POST`   | `/v1/<db>/<table>`      | Create; auto-increment ids are assigned by the database     |
| `GET`    | `/v1/<db>/<table>/:id`  | Read one                                                    |
| `PATCH`  | `/v1/<db>/<table>/:id`  | Update the fields sent                                      |
| `DELETE` | `/v1/<db>/<table>/:id`  | Delete                                                      |

`<db>` is `main` or `science`; `<table>` is the MySQL table name (e.g. `/v1/main/book_info`).
List responses look like `{ results, page, limit, totalPages, totalResults }`.

Validation follows the column definitions: `VARCHAR(n)` length, integer ranges (TINYINT,
UNSIGNED, …), enum values, MySQL `SET` members (comma-separated), the TIMESTAMP range, and
required/nullable columns. Value formats in JSON:

- `BIGINT` → number; `DECIMAL` → returned as a string
- `DATETIME`/`TIMESTAMP` → ISO 8601, stored as UTC; `DATE` → `YYYY-MM-DD` on input
- `BLOB`/`VARBINARY` → base64 string

### Access policy

Defined in [`src/config/resources.ts`](src/config/resources.ts); routes, `/v1/auth/me` and the Swagger
docs all read it:

- ADMIN: read and write every table.
- LIBRARIAN: read non-sensitive tables; write `book_*`.
- USER: read non-sensitive tables.
- Admin-only (sensitive): `log_*`, `template_log_*`, `private_data_*`, `session_info`,
  `tbl_captcha`, `apply_privatedata_info`, `data_order`, `overseas_data_order`, `report_info`,
  `opinion_info`, `search_keyword`, and `science_db.session_info`.

## Database workflow

- The databases are the source of truth; there are no Prisma migrations. After changing a table
  in MySQL (and in `prisma/sql/*.schema.sql`), run `yarn db:pull`; the new columns then appear in
  the endpoints, validation and Swagger docs automatically.
- Don't run `prisma db push` or `prisma migrate` against these databases: Prisma would rewrite
  columns it cannot represent exactly (e.g. MySQL `SET` columns).
- `user_info.userName` has a unique index (added on top of the original schema).
- `data_recording_text` has no primary key, so Prisma ignores it and it has no endpoints.
- Prisma is on 6.x on purpose: Prisma 7's MySQL driver cannot read `SET` columns, and Prisma 8
  requires Node 22.

## Project structure

```
prisma/
  schema.prisma            kcc_main models (introspected)
  science/schema.prisma    science_db models (client generated into node_modules/.prisma-science)
  sql/                     schema SQL for both databases
scripts/create-admin.ts
src/
  index.ts                 start-up and graceful shutdown
  app.ts                   Express app and middleware
  client.ts                Prisma client for kcc_main
  scienceClient.ts         Prisma client for science_db
  config/                  env config, roles, table access policy, passport, logging
  crud/                    generic table endpoints: model registry, validation, service, router, OpenAPI
  controllers/ services/ validations/   auth, users, permissions
  middlewares/             auth (roles), validation, errors, XSS cleaning, rate limiting
  routes/v1/               route definitions (+ Swagger JSDoc for auth/users)
  docs/                    OpenAPI definition and shared components
tests/
  unit/ integration/       Jest tests; Prisma is mocked, no database is used
```

## Testing

`yarn test` runs about 1,700 tests in a few seconds without a database: unit tests for roles, the
access policy, validation and services, and HTTP tests through the real Express app with both
Prisma clients mocked. Per-table tests run for every model, and the generated OpenAPI document is
validated. The test setup points the database URLs at a closed port, so tests can never touch MySQL.

## Production

```bash
yarn start   # builds, then runs under PM2 with NODE_ENV=production
```

- Set a strong `JWT_SECRET` and real database credentials in `.env`.
- Swagger UI is not served in production; unexpected errors are logged with a stack trace and
  returned to clients as `Internal Server Error`.
- CORS is open to all origins (`cors()` in `src/app.ts`); restrict it if the API is exposed
  publicly.

## Known limitations

- No per-row ownership: users cannot list only "their own" messages or orders; those tables are
  admin-only instead.
- `user_permission` lists (`forumPermission`, `dataPermission`, `systemPermission`) are stored and
  returned by `/v1/auth/me` but are not yet used to restrict table access.
- List filters are exact matches; there is no text search or date ranges.
- Request bodies are HTML-escaped by the XSS middleware (`<` is stored as `&lt;`).

## License

MIT. Based on [prisma-express-typescript-boilerplate](https://github.com/antonio-lazaro/prisma-express-typescript-boilerplate)
by Antonio Lázaro; see [LICENSE](LICENSE).
"# express-api" 
