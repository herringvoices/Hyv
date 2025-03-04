using System;
using System.Collections.Generic;

namespace Hyv.DTOs
{
    public class HangoutDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public DateTime Start { get; set; }
        public DateTime End { get; set; }
        public bool AllDay { get; set; } = false;

        public ExtendedPropsDto ExtendedProps { get; set; } 
    }

    public class ExtendedPropsDto
    {
        public string Description { get; set; }
        public bool Active { get; set; }
        public List<UserDto>? Guests { get; set; }
    }
}
