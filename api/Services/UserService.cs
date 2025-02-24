using System.Collections.Generic;
using System.Threading.Tasks;
using Hyv.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Hyv.Services
{
    public interface IUserService
    {
        Task<IEnumerable<User>> GetAllUsersAsync();
    }

    public class UserService : IUserService
    {
        private readonly UserManager<User> _userManager;

        public UserService(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task<IEnumerable<User>> GetAllUsersAsync()
        {
            return await _userManager.Users.ToListAsync();
        }
    }
}
