using IncidentAgent.Domain.Enums;

namespace IncidentAgent.Domain.Rules;

public static class IncidentStatusTransitions
{
    private static readonly Dictionary<Status, Status[]> Allowed = new()
    {
        [Status.Open] = [Status.Assigned, Status.Investigating, Status.Closed],
        [Status.Assigned] = [Status.Investigating, Status.Pending, Status.Open],
        [Status.Investigating] = [Status.Pending, Status.Resolved, Status.Assigned],
        [Status.Pending] = [Status.Investigating, Status.Resolved],
        [Status.Resolved] = [Status.Closed, Status.Investigating],
        [Status.Closed] = []
    };

    public static bool CanTransition(Status from, Status to) =>
        Allowed.TryGetValue(from, out var targets) && targets.Contains(to);
}
