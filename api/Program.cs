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
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
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
                if (
                    context.Request.Cookies.ContainsKey("jwt")
                    && string.IsNullOrEmpty(context.Token)
                )
                {
                    context.Token = context.Request.Cookies["jwt"];
                }
                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization();

// ✅ Register Services
builder.Services.AddScoped<IAuthService, AuthService>();

// ✅ Register AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// ✅ Add Swagger for API Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
