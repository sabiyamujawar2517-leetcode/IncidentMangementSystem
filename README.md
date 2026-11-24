# IncidentAgent

Starter for a future Smart Incident Management System. Right now it is only a
"Hello World" that proves three apps run and talk to each other.

| App | Path | URL |
|---|---|---|
| API (ASP.NET Core minimal API, .NET 10) | `backend/IncidentAgent.Api` | http://localhost:5080 |
| Blazor UI (standalone WebAssembly) | `frontend-blazor/IncidentAgent.BlazorUi` | http://localhost:5090 |
| Angular UI (standalone components, no SSR) | `frontend-angular` | http://localhost:4200 |

## Prerequisites

- .NET SDK 10
- Node.js 24 LTS and npm
- Angular CLI 22: `npm install -g @angular/cli@22`

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

Open http://localhost:5090 or http://localhost:4200 and click **Call API**.

## Endpoints

- `GET /api/hello` returns `{ "message": "Hello from IncidentAgent API", "timeUtc": "..." }`
- `GET /health` returns 200 OK
- `GET /openapi/v1.json` returns the OpenAPI document (Development only)

CORS allows only `http://localhost:5090` and `http://localhost:4200`.

## Configuration

- Blazor API base URL: `frontend-blazor/IncidentAgent.BlazorUi/wwwroot/appsettings.json` (`ApiBaseUrl`)
- Angular API base URL: `frontend-angular/src/environments/environment*.ts` (`apiBaseUrl`)

## Build

```bash
dotnet build IncidentAgent.slnx
cd frontend-angular && ng build
```
