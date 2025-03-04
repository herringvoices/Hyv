using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using DotNetEnv;
using Hyv.Data;
using Hyv.Models;
using Hyv.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ✅ Load .env file (only in development)
if (builder.Environment.IsDevelopment())
{
    Env.Load();
}

// ✅ Load Configuration (supports .env + system environment variables)
var configuration = builder.Configuration.AddEnvironmentVariables().Build();

// ✅ Build Connection String from Environment Variables
var connectionString =
    $"Host={configuration["POSTGRES_HOST"]};"
    + $"Database={configuration["POSTGRES_DB"]};"
    + $"Username={configuration["POSTGRES_USER"]};"
    + $"Password={configuration["POSTGRES_PASSWORD"]};"
    + $"SSL Mode={configuration["POSTGRES_SSL_MODE"]}";

// ✅ Retrieve JWT Secret from Environment Variables
var jwtSecret = Env.GetString("JWT_SECRET");

// ✅ Add Database Context
builder.Services.AddDbContext<HyvDbContext>(options => options.UseNpgsql(connectionString));

// ✅ Configure Identity
builder
    .Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<HyvDbContext>()
    .AddDefaultTokenProviders();

// ✅ Configure Authentication & JWT Bearer
builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero,
        };

        // ✅ Read token from HttpOnly cookie if Authorization header is missing
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["jwt"];
                Console.WriteLine("🔍 OnMessageReceived:");
                Console.WriteLine($"Cookie token found: {!string.IsNullOrEmpty(token)}");
                context.Token = token;
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("✅ OnTokenValidated reached!");
                var claimsIdentity = context.Principal?.Identity as ClaimsIdentity;
                Console.WriteLine($"Claims Identity null? {claimsIdentity == null}");

                if (claimsIdentity != null)
                {
                    Console.WriteLine("📝 Available Claims:");
                    foreach (var claim in claimsIdentity.Claims)
                    {
                        Console.WriteLine($"- {claim.Type}: {claim.Value}");
                    }

                    // Change this line to use the correct claim type
                    var userId = claimsIdentity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    Console.WriteLine($"🆔 Found UserId: {userId}");

                    if (!string.IsNullOrEmpty(userId))
                    {
                        context.HttpContext.Items["UserId"] = userId;
                        Console.WriteLine("✅ Set UserId in HttpContext.Items");
                    }
                }
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("❌ Authentication Failed:");
                Console.WriteLine($"Error: {context.Exception}");
                return Task.CompletedTask;
            },
            OnChallenge = async context =>
            {
                // Prevent default challenge response
                context.HandleResponse();

                // Write custom response
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "Unauthorized" });
            },
        };
    });
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowLocalDev",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

builder.Services.AddAuthorization();

// ✅ Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFriendRequestService, FriendRequestService>(); // Added registration for FriendRequestService
builder.Services.AddScoped<IFriendService, FriendService>(); // Added registration for FriendService
builder.Services.AddScoped<ITagalongService, TagalongService>(); // Added registration for TagalongService
builder.Services.AddScoped<INotificationService, NotificationService>(); // Added registration for NotificationService
builder.Services.AddScoped<IFriendshipCategoryService, FriendshipCategoryService>();
builder.Services.AddScoped<ICategoryMemberService, CategoryMemberService>(); // Add this line
builder.Services.AddScoped<IHangoutService, HangoutService>();
builder.Services.AddScoped<IWindowService, WindowService>(); // Add Window service registration

// ✅ Register AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// ✅ Add Controllers with JSON serialization options
builder
    .Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System
            .Text
            .Json
            .Serialization
            .ReferenceHandler
            .IgnoreCycles;
        opts.JsonSerializerOptions.MaxDepth = 32; // Reasonable depth limit
    });

// ✅ Add Swagger for API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// ✅ Ensure Migrations are Applied Automatically
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<HyvDbContext>();
    dbContext.Database.Migrate(); // Applies pending migrations on startup
}

// ✅ Configure Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowLocalDev");

// Add these in this specific order
app.UseAuthentication();
app.UseAuthorization(); // Remove the UseWhen wrapper
app.MapControllers();

app.Run();
