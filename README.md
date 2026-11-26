# IncidentAgent

Starter for a Smart Incident Management System. It has a .NET 10 minimal API
built with Clean Architecture, PostgreSQL through EF Core, and two front-ends.

| App | Path | URL |
|---|---|---|
| API (ASP.NET Core minimal API, .NET 10) | `backend/IncidentAgent.Api` | http://localhost:5080 |
| Blazor UI (standalone WebAssembly) | `frontend-blazor/IncidentAgent.BlazorUi` | http://localhost:5090 |
| Angular UI (standalone components, no SSR) | `frontend-angular` | http://localhost:4200 |
| PostgreSQL 17 (Docker) | `docker/docker-compose.yml` | localhost:5432 |

## Backend layout

| Project | Responsibility |
|---|---|
| `IncidentAgent.Domain` | Entities, enums (`Priority`, `Status`), status transition rules |
| `IncidentAgent.Application` | Service interfaces, request/response DTOs, `Result` type |
| `IncidentAgent.Infrastructure` | `ApplicationDbContext`, EF configurations, migrations, service implementations, dev seeder |
| `IncidentAgent.Api` | Minimal API endpoints, health checks, CORS, OpenAPI |

## Prerequisites

- .NET SDK 10
- EF Core CLI: `dotnet tool install -g dotnet-ef`
- Docker (for PostgreSQL)
- Node.js 24 LTS and npm
- Angular CLI 22: `npm install -g @angular/cli@22`
- `curl` and `jq` (only for the smoke test)

## Setup

### 1. Start PostgreSQL

```bash
cp docker/.env.example docker/.env      # then set POSTGRES_PASSWORD
docker compose -f docker/docker-compose.yml up -d
```

### 2. Give the API the database password

The connection string in `appsettings.json` has no password. Store it in user secrets:

```bash
dotnet user-secrets set "ConnectionStrings:Postgres" \
  "Host=localhost;Port=5432;Database=incidentagent;Username=incidentagent;Password=<your-password>" \
  --project backend/IncidentAgent.Api
```

### 3. Apply migrations

```bash
dotnet ef database update \
  --project backend/IncidentAgent.Infrastructure \
  --startup-project backend/IncidentAgent.Api
```

Migrations, in `backend/IncidentAgent.Infrastructure/Persistence/Migrations`:

| Migration | What it does |
|---|---|
| `20261124123255_InitialCreate` | Creates `Users`, `IncidentCategories`, `ApplicationServices`, `SlaPolicies`, `Incidents`, `IncidentAssignments`, `IncidentAttachments`, `IncidentComments`, `IncidentHistory` |
| `20261124162832_AddIncidentNumberSequence` | Adds the `incident_number_seq` sequence used for incident numbers |
| `20261124162835_MakeActorOptional` | Makes the acting user optional on history and assignment records |

To add a migration:

```bash
dotnet ef migrations add <Name> \
  --project backend/IncidentAgent.Infrastructure \
  --startup-project backend/IncidentAgent.Api \
  --output-dir Persistence/Migrations
```

### Dev seed data

In Development the API runs `DevDataSeeder` at startup. The seeder is idempotent and adds:

- Categories: Hardware, Software, Network, Access, Application Error
- Services: Customer Portal, Payments API, Email Service, Internal HR System, Payment API
- Users: Alex Reporter, Sam Engineer, Jordan Lead, Admin User
- SLA policies for P1 to P4

## Run

Start the API first, then either UI. Use a separate terminal for each, running from the repo root.

```bash
# 1. API
dotnet run --project backend/IncidentAgent.Api

# 2. Blazor UI
dotnet run --project frontend-blazor/IncidentAgent.BlazorUi

# 3. Angular UI (first time: npm install)
cd frontend-angular
npm install
ng serve
```

Blazor UI pages:

| Page | Route |
|---|---|
| Dashboard | `/` |
| Incidents list | `/incidents` |
| Incident details | `/incidents/{id}` |
| Categories | `/categories` |
| Services | `/services` |
| API check | `/api-check` |

The Angular UI is still the Hello World page (**Call API**).

## Endpoints

### Incidents (`/api/incidents`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/incidents` | Create an incident (returns 201 with `INC-<year>-<000001>` number, status `Open`) |
| `GET` | `/api/incidents` | Paged list. Query: `page`, `pageSize` (1 to 100, default 20), `status`, `priority`, `categoryId`, `serviceId`, `assignedToId` |
| `GET` | `/api/incidents/{id}` | Get one incident |
| `PUT` | `/api/incidents/{id}` | Update title, description, priority, category, service |
| `POST` | `/api/incidents/{id}/assign` | Assign to a user (moves `Open` to `Assigned`) |
| `POST` | `/api/incidents/{id}/status` | Change status (`newStatus`, optional `actorUserId`, `note`) |
| `POST` | `/api/incidents/{id}/comments` | Add a comment |
| `GET` | `/api/incidents/{id}/history` | Field change history |

Enums are sent as strings. `Priority` is `P1Critical`, `P2High`, `P3Medium` or `P4Low`.

Allowed status transitions (anything else returns 409):

| From | To |
|---|---|
| Open | Assigned, Investigating, Closed |
| Assigned | Investigating, Pending, Open |
| Investigating | Pending, Resolved, Assigned |
| Pending | Investigating, Resolved |
| Resolved | Closed, Investigating |
| Closed | (none; closed incidents cannot be updated or commented on) |

Errors use ProblemDetails: 400 for validation errors or malformed JSON, 404 for an unknown id, 409 for a rule violation.

### Reference data

- `GET /api/categories`
- `GET /api/services`

### Other

- `GET /api/hello` returns `{ "message": "Hello from IncidentAgent API", "timeUtc": "..." }`
- `GET /health` liveness: returns 200 if the process is up
- `GET /health/ready` readiness: returns 200 if PostgreSQL is reachable
- `GET /openapi/v1.json` OpenAPI document (Development only)

CORS allows only `http://localhost:5090` and `http://localhost:4200`.

## Smoke test

With the API running and seed data loaded:

```bash
bash backend/IncidentAgent.Api/smoke-test.sh
# or against another host:
BASE=http://localhost:5080 bash backend/IncidentAgent.Api/smoke-test.sh
```

The script tests create, list and paging, update, assign, valid and invalid status changes, comments, history,
the closed-incident rules, validation errors, 404, concurrent incident numbering, and health checks. It reads user
ids from the `incidentagent-postgres` container. It prints `ALL PASSED` or exits with code 1.

## Configuration

- API connection string: `ConnectionStrings:Postgres` (`appsettings.json` plus user secrets for the password)
- Postgres password for Docker: `docker/.env` (`POSTGRES_PASSWORD`, git-ignored)
- Blazor API base URL: `frontend-blazor/IncidentAgent.BlazorUi/wwwroot/appsettings.json` (`ApiBaseUrl`)
- Angular API base URL: `frontend-angular/src/environments/environment*.ts` (`apiBaseUrl`)

## Build

```bash
dotnet build IncidentAgent.slnx
cd frontend-angular && ng build
```
