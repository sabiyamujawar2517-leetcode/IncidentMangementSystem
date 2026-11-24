using IncidentAgent.Application.Common;

namespace IncidentAgent.Api.Endpoints;

public static class ResultHttpExtensions
{
    public static IResult ToHttpResult<T>(this Result<T> result, Func<T, IResult> onSuccess) => result.Status switch
    {
        ResultStatus.Success => onSuccess(result.Value!),
        ResultStatus.Validation => Results.ValidationProblem(result.Errors),
        ResultStatus.NotFound => Results.Problem(statusCode: StatusCodes.Status404NotFound, title: "Not Found", detail: FirstError(result)),
        ResultStatus.Conflict => Results.Problem(statusCode: StatusCodes.Status409Conflict, title: "Conflict", detail: FirstError(result)),
        _ => Results.Problem()
    };

    private static string? FirstError<T>(Result<T> result) => result.Errors.Values.SelectMany(v => v).FirstOrDefault();
}
