namespace Hyv.DTOs;

public class WindowDto
{
    // FullCalendar expects a string ID
    public string Title
    {
        get
        {
            if (ExtendedProps?.HangoutId == 0)
            {
                // Build a comma-separated list of participant full names.
                // Add null checks to prevent exceptions
                var participantNames = string.Empty;
                if (ExtendedProps?.Participants != null)
                {
                    participantNames = string.Join(
                        ", ",
                        ExtendedProps
                            .Participants.Where(p => p?.User != null)
                            .Select(p => $"{p.User.FirstName} {p.User.LastName}".Trim())
                    );
                }

                // Retrieve the preferred activity if available.
                var activity = ExtendedProps?.PreferredActivity ?? string.Empty;

                // Combine the pieces using bullet points with spaces.
                return $"{participantNames} • {activity}";
            }
            else
            {
                return _title;
            }
        }
        set { _title = value; }
    }
    private string _title;
    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    // Computed properties for FullCalendar styling
    // Assign Tailwind classes
    public string ClassName =>
        ExtendedProps?.HangoutId.HasValue == true
            ? "bg-secondary text-light"
            : "bg-primary text-dark";

    // All additional properties must be inside ExtendedProps
    public WindowExtendedPropsDto ExtendedProps { get; set; }
}

public class WindowExtendedPropsDto
{
    public string? UserId { get; set; }
    public string? PreferredActivity { get; set; }
    public int? DaysOfNoticeNeeded { get; set; }
    public bool? Active { get; set; }
    public int? HangoutId { get; set; }

    // Optional expansions - now inside ExtendedProps
    public UserDto? User { get; set; }
    public HangoutDto? Hangout { get; set; }
    public List<WindowParticipantDto>? Participants { get; set; }
    public List<WindowVisibilityDto>? Visibilities { get; set; }
}
