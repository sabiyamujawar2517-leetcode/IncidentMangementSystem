namespace IncidentAgent.BlazorUi.Services;

/// <summary>Outcome of an API call. Error holds a user-facing message; IsCanceled means the caller navigated away.</summary>
public sealed class ApiResult<T>
{
    public T? Value { get; private init; }
    public string? Error { get; private init; }
    public int? StatusCode { get; private init; }
    public bool IsCanceled { get; private init; }
    public bool IsSuccess => Error is null && !IsCanceled;

    public static ApiResult<T> Ok(T value) => new() { Value = value };
    public static ApiResult<T> Fail(string error, int? statusCode = null) => new() { Error = error, StatusCode = statusCode };
    public static ApiResult<T> Canceled() => new() { IsCanceled = true };

    public ApiResult<TOther> As<TOther>() => new() { Error = Error, StatusCode = StatusCode, IsCanceled = IsCanceled };
}
