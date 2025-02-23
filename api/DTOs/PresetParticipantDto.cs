using Hyv.DTOs;

namespace Hyv.DTOs
{
    public class PresetParticipantDto
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public int PresetId { get; set; }

        public UserDto? User { get; set; }
        public PresetDto? Preset { get; set; }
    }
}
