using System;
using System.Collections.Generic;

namespace Hyv.Models
{
    public class Hangout
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime ConfirmedStart { get; set; }
        public DateTime ConfirmedEnd { get; set; }
        public bool Active { get; set; }

        // Navigation properties
        public ICollection<HangoutRequest> HangoutRequests { get; set; }
        public ICollection<HangoutGuest> HangoutGuests { get; set; }
    }
}
