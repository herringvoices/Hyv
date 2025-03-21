using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using CloudinaryDotNet;
using DotNetEnv; // Only used for local dev loading of .env
using Hyv.Data;
using Hyv.Models;
using Hyv.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    Env.Load();
}

// Build Configuration to pick up environment variables
var configuration = builder.Configuration.AddEnvironmentVariables().Build();

// Build Postgres connection string based on environment
string connectionString;
if (builder.Environment.IsDevelopment())
{
    // Use DEV_ prefixed variables in development
    connectionString =
        $"Host={configuration["DEV_POSTGRES_HOST"]};"
        + $"Database={configuration["DEV_POSTGRES_DB"]};"
        + $"Username={configuration["DEV_POSTGRES_USER"]};"
        + $"Password={configuration["DEV_POSTGRES_PASSWORD"]};"
        + $"SSL Mode={configuration["DEV_POSTGRES_SSL_MODE"]};";
}
else
{
    // Use non-prefixed variables in production
    connectionString =
        $"Host={configuration["POSTGRES_HOST"]};"
        + $"Database={configuration["POSTGRES_DB"]};"
        + $"Username={configuration["POSTGRES_USER"]};"
        + $"Password={configuration["POSTGRES_PASSWORD"]};"
        + $"SSL Mode={configuration["POSTGRES_SSL_MODE"]};";
}

// IMPORTANT: Read JWT secret from configuration
// (this will pick up the variable from Azure App Settings in Production)
var jwtSecret = configuration["JWT_SECRET"];

//Throw an error if JWT_SECRET is not set
if (string.IsNullOrWhiteSpace(jwtSecret))
{
    throw new InvalidOperationException(
        "JWT_SECRET is not set. Make sure you configure it in Azure (App Settings) or in your local .env file."
    );
}

// Read Cloudinary settings
var cloudName = configuration["CLOUDINARY_CLOUDNAME"];
var apiKey = configuration["CLOUDINARY_APIKEY"];
var apiSecret = configuration["CLOUDINARY_APISECRET"];

if (
    string.IsNullOrWhiteSpace(cloudName)
    || string.IsNullOrWhiteSpace(apiKey)
    || string.IsNullOrWhiteSpace(apiSecret)
)
{
    throw new InvalidOperationException(
        "Cloudinary configuration is missing. Please check your environment variables."
    );
}

// Configure Cloudinary
var cloudinaryAccount = new Account(cloudName, apiKey, apiSecret);
var cloudinary = new Cloudinary(cloudinaryAccount);
builder.Services.AddSingleton(cloudinary);

// --- Add DbContext ---
builder.Services.AddDbContext<HyvDbContext>(options => options.UseNpgsql(connectionString));

// --- Configure Identity ---
builder
    .Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<HyvDbContext>()
    .AddDefaultTokenProviders();

// --- Configure Authentication & JWT Bearer ---
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

        // Optional: read token from HttpOnly cookie if header is missing
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

                    // Typically, the name identifier is the user’s ID in Identity
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
                // Prevent the default challenge response
                context.HandleResponse();

                // Write custom response
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { message = "Unauthorized" });
            },
        };
    });

// --- CORS policy ---
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowLocalDev",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "http://localhost:4173",
                    "https://hyv.azurewebsites.net",
                    "https://www.hy-hyv.buzz",
                    "https://hy-hyv.buzz"
                )
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

// Configure cookie policy
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.MinimumSameSitePolicy = SameSiteMode.None;
    options.Secure = CookieSecurePolicy.Always;
    options.HttpOnly = HttpOnlyPolicy.Always;
});

builder.Services.AddAuthorization();

// --- Register Services ---
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IFriendRequestService, FriendRequestService>();
builder.Services.AddScoped<IFriendService, FriendService>();
builder.Services.AddScoped<ITagalongService, TagalongService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IFriendshipCategoryService, FriendshipCategoryService>();
builder.Services.AddScoped<ICategoryMemberService, CategoryMemberService>();
builder.Services.AddScoped<IHangoutService, HangoutService>();
builder.Services.AddScoped<IWindowService, WindowService>();
builder.Services.AddScoped<IPresetService, PresetService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();

// --- AutoMapper ---
builder.Services.AddAutoMapper(typeof(MappingProfile));

// --- Controllers (with JSON options) ---
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

// --- Swagger ---
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();

var app = builder.Build();

// Automatically apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<HyvDbContext>();
    dbContext.Database.Migrate();
}

// Configure middleware
// if (app.Environment.IsDevelopment())
// {
app.UseSwagger();
app.UseSwaggerUI();

// }

app.UseHttpsRedirection();
app.UseCors("AllowLocalDev");

app.UseCookiePolicy();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
