namespace IncidentAgent.BlazorUi.Services;

/// <summary>Lets the top bar Refresh button ask the current page to reload its data.</summary>
public class RefreshNotifier
{
    public event Func<Task>? Requested;

    public Task RequestAsync() => Requested?.Invoke() ?? Task.CompletedTask;
}
