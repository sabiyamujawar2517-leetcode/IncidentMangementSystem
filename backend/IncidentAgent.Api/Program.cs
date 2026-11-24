using System.Text.Json.Serialization;
using IncidentAgent.Api.Endpoints;
using IncidentAgent.Infrastructure;
using IncidentAgent.Infrastructure.Persistence;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

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

    using var scope = app.Services.CreateScope();
    await DevDataSeeder.SeedAsync(scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(), CancellationToken.None);
}

// Keep 400 for malformed request bodies (BadHttpRequestException) instead of turning them into 500.
app.UseExceptionHandler(new ExceptionHandlerOptions
{
    StatusCodeSelector = ex => ex is BadHttpRequestException bad ? bad.StatusCode : StatusCodes.Status500InternalServerError
});
app.UseStatusCodePages();
app.UseCors(FrontendCorsPolicy);

// Liveness: process is up, no dependency checks.
app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false });

// Readiness: PostgreSQL is reachable.
app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = c => c.Tags.Contains("ready") });

app.MapGet("/api/hello", () => new HelloResponse("Hello from IncidentAgent API", DateTime.UtcNow))
    .WithName("GetHello");

app.MapIncidentEndpoints();
app.MapReferenceDataEndpoints();

app.Run();

record HelloResponse(string Message, DateTime TimeUtc);
