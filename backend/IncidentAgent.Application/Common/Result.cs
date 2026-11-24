namespace IncidentAgent.Application.Common;

public enum ResultStatus
{
    Success,
    NotFound,
    Validation,
    Conflict
}

public sealed class Result<T>
{
    private Result(ResultStatus status, T? value, IReadOnlyDictionary<string, string[]> errors)
    {
        Status = status;
        Value = value;
        Errors = errors;
    }

    public ResultStatus Status { get; }
    public T? Value { get; }
    public IReadOnlyDictionary<string, string[]> Errors { get; }
    public bool IsSuccess => Status == ResultStatus.Success;

    public static Result<T> Success(T value) => new(ResultStatus.Success, value, new Dictionary<string, string[]>());
    public static Result<T> NotFound(string message) => new(ResultStatus.NotFound, default, Single("id", message));
    public static Result<T> Conflict(string message) => new(ResultStatus.Conflict, default, Single("conflict", message));
    public static Result<T> Validation(IReadOnlyDictionary<string, string[]> errors) => new(ResultStatus.Validation, default, errors);
    public static Result<T> Validation(string field, string message) => Validation(Single(field, message));

    private static Dictionary<string, string[]> Single(string key, string message) => new() { [key] = [message] };
}

/// <summary>Collects field errors during manual validation.</summary>
public sealed class ValidationErrors
{
    private readonly Dictionary<string, List<string>> _errors = new();

    public bool HasErrors => _errors.Count > 0;

    public void Add(string field, string message)
    {
        if (!_errors.TryGetValue(field, out var list))
        {
            _errors[field] = list = [];
        }
        list.Add(message);
    }

    public void Required(string field, string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            Add(field, $"{field} is required.");
        else if (value.Length > maxLength)
            Add(field, $"{field} must be at most {maxLength} characters.");
    }

    public IReadOnlyDictionary<string, string[]> ToDictionary() =>
        _errors.ToDictionary(e => e.Key, e => e.Value.ToArray());
}
