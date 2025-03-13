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
        public string BackgroundColor => "#F2CA50";
        public string TextColor => "#fefce8";

        // public string ClassName => "bg-secondary text-light";

        public ExtendedPropsDto ExtendedProps { get; set; }
    }

    public class ExtendedPropsDto
    {
        public string Description { get; set; }
        public bool Active { get; set; }
        public List<UserDto>? Guests { get; set; }
    }
}
