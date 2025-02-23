using System;
using System.Collections.Generic;

namespace Hyv.DTOs
{
    public class HangoutDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime ConfirmedStart { get; set; }
        public DateTime ConfirmedEnd { get; set; }
        public bool Active { get; set; }
        public List<UserDto>? Guests { get; set; }
    }
}
