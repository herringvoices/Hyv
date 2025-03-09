using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Models
{
    // Properties inherrited from IdentityUser: Id, Username, Email, and PasswordHash.
    [Index(nameof(UserName), IsUnique = true)]
    public class User : IdentityUser
    {
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; }

        public string ProfilePicture { get; set; } = "";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string FullName
        {
            get { return $"{FirstName} {LastName}"; }
        }

        public virtual ICollection<Friendship> SentFriendships { get; set; } =
            new List<Friendship>();
        public virtual ICollection<Friendship> ReceivedFriendships { get; set; } =
            new List<Friendship>();
        public virtual ICollection<Tagalong> SentTagalongs { get; set; } = new List<Tagalong>();
        public virtual ICollection<Tagalong> ReceivedTagalongs { get; set; } = new List<Tagalong>();
        public virtual ICollection<FriendshipCategory> FriendshipCategories { get; set; } =
            new List<FriendshipCategory>();
        public virtual ICollection<WindowParticipant> WindowParticipants { get; set; } =
            new List<WindowParticipant>();

        public virtual ICollection<HangoutGuest> HangoutGuests { get; set; } =
            new List<HangoutGuest>();
        public virtual ICollection<HangoutRequestRecipient> HangoutRequestRecipients { get; set; } =
            new List<HangoutRequestRecipient>();
        public virtual ICollection<JoinRequest> JoinRequests { get; set; } =
            new List<JoinRequest>();
    }
}
