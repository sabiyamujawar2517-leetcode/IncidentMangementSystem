var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

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

app.MapGet("/health", () => Results.Ok());

app.MapGet("/api/hello", () => new HelloResponse("Hello from IncidentAgent API", DateTime.UtcNow))
    .WithName("GetHello");

app.Run();

record HelloResponse(string Message, DateTime TimeUtc);
