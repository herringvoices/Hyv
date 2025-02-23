using System.Collections.Generic;

namespace Hyv.DTOs
{
    public class FriendshipCategoryDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; }
        public List<UserDto>? Friends { get; set; }
    }
}
