using System.Text;
using FluentValidation;
using Hrm.Api.Common.Auth;
using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Auth;
using Hrm.Api.Features.Authorization;
using Hrm.Api.Features.Employees;
using Hrm.Api.Features.Lookups;
using Hrm.Api.Features.Organization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .WriteTo.File("logs/hrm-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();
builder.Host.UseSerilog();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddScoped<AuditInterceptor>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<AdminUserSeeder>();
builder.Services.AddScoped<Hrm.Api.Features.Lookups.Seeding.CategorySeeder>();
builder.Services.AddScoped<Hrm.Api.Features.Lookups.Seeding.SampleDataSeeder>();
builder.Services.AddScoped<LookupCodeGenerator>();
builder.Services.AddScoped<LookupValidator>();
builder.Services.AddScoped<AuthorizationSeeder>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddHostedService<DatabaseSeeder>();

builder.Services.AddDbContext<HrmDbContext>((sp, options) =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
    options.AddInterceptors(sp.GetRequiredService<AuditInterceptor>());
});

var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly);

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "HRM API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        [new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Reference = new Microsoft.OpenApi.Models.OpenApiReference
            {
                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                Id = "Bearer"
            }
        }] = Array.Empty<string>()
    });
});

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapAuthEndpoints();
app.MapLookupEndpoints();
app.MapOrganizationEndpoints();
app.MapEmployeeEndpoints();
app.MapEmployeePersonalEndpoints();
app.MapLaborContractEndpoints();
app.MapEmployeeFamilyEndpoints();
app.MapEmployeeBankEndpoints();
app.MapEmployeeSublistEndpoints();
app.MapEmployeeDocumentEndpoints();
app.MapFunctionGroupEndpoints();
app.MapScreenEndpoints();
app.MapPermissionEndpoints();
app.MapRoleGroupEndpoints();
app.MapAuthorizationUserEndpoints();
app.MapUserManagementEndpoints();

app.Run();

public partial class Program { }
