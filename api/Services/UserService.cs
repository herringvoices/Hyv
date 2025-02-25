using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper; // Added for mapping
using Hyv.Data;
using Hyv.DTOs; // Added for UserDto
using Hyv.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
        Task<bool> DeleteAllUsersAsync();

        // Changed return type to use UserDto.
        Task<IEnumerable<UserDto>> SearchUsersByUsernameAsync(string query);
    }

    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;
        private readonly HyvDbContext _context;
        private readonly IMapper _mapper; // Added field

        public UserService(UserManager<User> userManager, HyvDbContext context, IMapper mapper)
        {
            _userManager = userManager;
            _context = context;
            _mapper = mapper; // Initialize mapper
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _userManager.Users.ToListAsync();
        }

        public async Task<bool> DeleteAllUsersAsync()
        {
            // Remove all users
            _context.Users.RemoveRange(_context.Users);

            // Save changes
            int result = await _context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<IEnumerable<UserDto>> SearchUsersByUsernameAsync(string query)
        {
            var users = await _userManager
                .Users.Where(u => EF.Functions.Like(u.UserName.ToLower(), $"%{query.ToLower()}%"))
                .ToListAsync();
            
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }
    }
}
