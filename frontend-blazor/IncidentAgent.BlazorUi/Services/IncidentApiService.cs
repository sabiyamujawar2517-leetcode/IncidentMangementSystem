using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IncidentAgent.BlazorUi.Models;

namespace IncidentAgent.BlazorUi.Services;

public class IncidentApiService(HttpClient http)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    public Task<ApiResult<PagedResult<IncidentListItem>>> GetIncidentsAsync(IncidentFilter filter, CancellationToken ct) =>
        GetAsync<PagedResult<IncidentListItem>>("api/incidents" + filter.ToQueryString(), ct);

    public Task<ApiResult<IncidentDetail>> GetIncidentAsync(Guid id, CancellationToken ct) =>
        GetAsync<IncidentDetail>($"api/incidents/{id}", ct);

    public Task<ApiResult<List<IncidentHistoryEntry>>> GetHistoryAsync(Guid id, CancellationToken ct) =>
        GetAsync<List<IncidentHistoryEntry>>($"api/incidents/{id}/history", ct);

    public Task<ApiResult<List<Category>>> GetCategoriesAsync(CancellationToken ct) =>
        GetAsync<List<Category>>("api/categories", ct);

    public Task<ApiResult<List<AppService>>> GetServicesAsync(CancellationToken ct) =>
        GetAsync<List<AppService>>("api/services", ct);

    /// <summary>Count of incidents matching the filters, taken from totalCount of a pageSize=1 request.</summary>
    public async Task<ApiResult<int>> GetStatusCountAsync(IncidentStatus? status, Priority? priority, CancellationToken ct)
    {
        var result = await GetIncidentsAsync(new IncidentFilter { PageSize = 1, Status = status, Priority = priority }, ct);
        return result.IsSuccess ? ApiResult<int>.Ok(result.Value!.TotalCount) : result.As<int>();
    }

    private async Task<ApiResult<T>> GetAsync<T>(string url, CancellationToken ct)
    {
        try
        {
            using var response = await http.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
                return ApiResult<T>.Fail(await DescribeErrorAsync(response, ct), (int)response.StatusCode);

            var value = await response.Content.ReadFromJsonAsync<T>(Json, ct);
            return value is null ? ApiResult<T>.Fail("The API returned an empty response.") : ApiResult<T>.Ok(value);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            return ApiResult<T>.Canceled();
        }
        catch (HttpRequestException)
        {
            return ApiResult<T>.Fail($"Cannot reach the API at {http.BaseAddress}. Check that it is running.");
        }
        catch (TaskCanceledException)
        {
            return ApiResult<T>.Fail("The API took too long to respond. Please try again.");
        }
        catch (JsonException)
        {
            return ApiResult<T>.Fail("The API returned data in an unexpected format.");
        }
    }

    private static async Task<string> DescribeErrorAsync(HttpResponseMessage response, CancellationToken ct)
    {
        ProblemDetailsResponse? problem = null;
        try
        {
            problem = await response.Content.ReadFromJsonAsync<ProblemDetailsResponse>(Json, ct);
        }
        catch (Exception ex) when (ex is JsonException or NotSupportedException)
        {
            // Not a ProblemDetails body; fall through to a generic message.
        }

        var validation = problem?.Errors?.SelectMany(e => e.Value).ToList();
        if (validation is { Count: > 0 }) return string.Join(" ", validation);
        if (!string.IsNullOrWhiteSpace(problem?.Detail)) return problem.Detail;

        return response.StatusCode switch
        {
            HttpStatusCode.NotFound => "The requested item was not found.",
            HttpStatusCode.BadRequest => "The request was not valid.",
            _ => $"The API returned an error ({(int)response.StatusCode} {response.ReasonPhrase})."
        };
    }
}
