using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using DotNetEnv;
using Hyv.DTOs;
using Hyv.Models;
using Microsoft.AspNetCore.Http;
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
            SignInManager<User> signInManager,
            IConfiguration configuration,
            IHttpContextAccessor httpContextAccessor,
            IMapper mapper
        )
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _httpContextAccessor = httpContextAccessor;
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

            // 1) Manually verify the password, instead of .PasswordSignInAsync()
            var passwordValid = await _userManager.CheckPasswordAsync(user, loginDto.Password);
            if (!passwordValid)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Message = "Invalid email or password.",
                };
            }

            // 2) Generate JWT
            var token = GenerateJwtToken(user);

            // 3) Set your JWT cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Must be true for cross-origin with SameSite=None
                SameSite = SameSiteMode.None, // Required for cross-origin requests
                Expires = DateTime.UtcNow.AddDays(7),
            };
            _httpContextAccessor.HttpContext.Response.Cookies.Append("jwt", token, cookieOptions);

            return new AuthResultDto
            {
                Success = true,
                Message = "Login successful.",
                User = _mapper.Map<UserDto>(user),
            };
        }

        public async Task<AuthResultDto> GetCurrentUserAsync()
        {
            if (_httpContextAccessor.HttpContext == null)
            {
                return new AuthResultDto { Success = false, Message = "HttpContext is null." };
            }

            var userId = _httpContextAccessor.HttpContext.Items["UserId"] as string;
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
            Console.WriteLine(
                $"RegisterDto: UserName={registerDto.UserName}, Email={registerDto.Email}, FirstName={registerDto.FirstName}, LastName={registerDto.LastName}"
            );
            // Check if username is already taken
            var existingUser = await _userManager.FindByNameAsync(registerDto.UserName);
            if (existingUser != null)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Message = "Username is already taken.",
                };
            }

            var user = new User
            {
                UserName = registerDto.UserName,
                Email = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Message = string.Join(", ", result.Errors.Select(e => e.Description)),
                };
            }

            // Generate token and set cookie like in LoginAsync
            var token = GenerateJwtToken(user);
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Must be true for cross-origin with SameSite=None
                SameSite = SameSiteMode.None, // Required for cross-origin requests
                Expires = DateTime.UtcNow.AddDays(7),
            };
            _httpContextAccessor.HttpContext.Response.Cookies.Append("jwt", token, cookieOptions);

            return new AuthResultDto
            {
                Success = true,
                Message = "Registration successful",
                User = _mapper.Map<UserDto>(user),
            };
        }

        public async Task<AuthResultDto> LogoutAsync()
        {
            if (_httpContextAccessor.HttpContext == null)
            {
                throw new InvalidOperationException("HttpContext is null.");
            }

            var expiredCookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
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
            var jwtSecret = Env.GetString("JWT_SECRET");

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
            var tokenString = tokenHandler.WriteToken(token);

            return tokenString;
        }
    }
}
