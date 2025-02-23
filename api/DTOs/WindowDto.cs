namespace Hyv.DTOs;

public class WindowDto
{
    public string Id { get; set; } // FullCalendar expects a string ID
    public string Title { get; set; }
    public DateTime Start { get; set; }
    public DateTime End { get; set; }

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
