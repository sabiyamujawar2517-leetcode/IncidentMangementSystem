using IncidentAgent.Application.Incidents;
using IncidentAgent.Application.ReferenceData;
using IncidentAgent.Infrastructure.Persistence;
using IncidentAgent.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace IncidentAgent.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException("Connection string 'Postgres' is not configured.");

        services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IIncidentService, IncidentService>();
        services.AddScoped<IReferenceDataService, ReferenceDataService>();

        return services;
    }
}
