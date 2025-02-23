using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DotNetEnv;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Hyv.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMapper _mapper;

        public AuthService(
            UserManager<User> userManager,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper
        )
        {
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
            _configuration = configuration;
            _mapper = mapper;
            Env.Load(); // Load environment variables from .env file
        }

        public async Task<AuthResultDto> LoginAsync(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Message = "Invalid email or password.",
                };
            }

            var result = await _signInManager.PasswordSignInAsync(
                user,
                loginDto.Password,
                false,
                false
            );
            if (!result.Succeeded)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Message = "Invalid email or password.",
                };
            }

            // ✅ Generate JWT Token
            var token = GenerateJwtToken(user);

            // ✅ Store JWT in HttpOnly Cookie with `SameSite=Strict`
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true, // ✅ JavaScript cannot access this cookie
                Secure = true, // ✅ Only send over HTTPS
                SameSite = SameSiteMode.Strict, // ✅ Prevents CSRF by blocking cross-site requests
                Expires = DateTime.UtcNow.AddDays(7),
            };

            _httpContextAccessor.HttpContext.Response.Cookies.Append("jwt", token, cookieOptions);

            return new AuthResultDto { Success = true, Message = "Login successful." };
        }

        public async Task<AuthResultDto> GetCurrentUserAsync()
        {
            var userId = _httpContextAccessor.HttpContext.User.FindFirstValue(
                JwtRegisteredClaimNames.Sub
            );
            if (string.IsNullOrEmpty(userId))
            {
                return new AuthResultDto { Success = false, Message = "No user found." };
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new AuthResultDto { Success = false, Message = "User not found." };
            }

            var userDto = _mapper.Map<UserDto>(user);
            return new AuthResultDto
            {
                Success = true,
                Message = "User retrieved successfully.",
                User = userDto,
            };
        }

        public async Task<AuthResultDto> RegisterAsync(RegisterDto registerDto)
        {
            var user = new User
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
            {
                var errorMessage = string.Join(", ", result.Errors.Select(e => e.Description));
                return new AuthResultDto
                {
                    Success = false,
                    Message = $"Registration failed: {errorMessage}",
                };
            }

            // ✅ Generate JWT Token
            var token = GenerateJwtToken(user);

            return new AuthResultDto
            {
                Success = true,
                Token = token,
                Message = "Registration successful.",
            };
        }

        public async Task<AuthResultDto> LogoutAsync()
        {
            var expiredCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(-1),
            };

            _httpContextAccessor.HttpContext.Response.Cookies.Append(
                "jwt",
                "",
                expiredCookieOptions
            );

            return new AuthResultDto { Success = true, Message = "Logged out successfully." };
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSecret = Env.GetString("JWT_SECRET"); // Get from .env
            var key = Encoding.UTF8.GetBytes(jwtSecret);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.UserName),
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature
                ),
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
