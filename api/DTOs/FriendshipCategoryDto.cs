using System;
using System.Collections.Generic;

namespace Hyv.DTOs
{
    public class FriendshipCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string UserId { get; set; } // Ensure this is a string to match the GUID format
        public IEnumerable<UserDto> Friends { get; set; }
    }
}
