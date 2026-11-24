using IncidentAgent.Application.ReferenceData;

namespace IncidentAgent.Api.Endpoints;

public static class ReferenceDataEndpoints
{
    public static IEndpointRouteBuilder MapReferenceDataEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/categories", async (IReferenceDataService service, CancellationToken ct) =>
            Results.Ok(await service.GetCategoriesAsync(ct)))
            .WithTags("Reference Data").WithName("GetCategories");

        app.MapGet("/api/services", async (IReferenceDataService service, CancellationToken ct) =>
            Results.Ok(await service.GetServicesAsync(ct)))
            .WithTags("Reference Data").WithName("GetServices");

        return app;
    }
}
