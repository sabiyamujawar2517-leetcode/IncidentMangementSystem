using IncidentAgent.Infrastructure;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// DbContext must be registered before the health checks that depend on the database.
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("Postgres")!, name: "postgres", tags: ["ready"]);

// Only the two local front-ends may call this API from a browser.
const string FrontendCorsPolicy = "Frontends";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy => policy
        .WithOrigins("http://localhost:5090", "http://localhost:4200")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // served at /openapi/v1.json
}

app.UseCors(FrontendCorsPolicy);

// Liveness: process is up, no dependency checks.
app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false });

// Readiness: PostgreSQL is reachable.
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready") });

app.MapGet("/api/hello", () => new HelloResponse("Hello from IncidentAgent API", DateTime.UtcNow))
    .WithName("GetHello");

app.Run();

record HelloResponse(string Message, DateTime TimeUtc);
