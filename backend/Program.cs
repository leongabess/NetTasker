using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;

using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;


var builder = WebApplication.CreateBuilder(args);

bool useInMemory = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string not found.");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200") 
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
});

builder.Services.AddDbContext<UserDb>(options =>
{
    if (useInMemory)
    {
        options.UseInMemoryDatabase("UserListMemory");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

builder.Services.AddDbContext<TodoDb>(options =>
{
    if (useInMemory)
    {
        options.UseInMemoryDatabase("TodoMemory");
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});
builder.Services.AddDatabaseDeveloperPageExceptionFilter();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddAuthorization();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!))
        };
    });
builder.Services.AddOpenApiDocument(config =>
{
    config.DocumentName = "UserAPI";
    config.Title = "UserAPI V1";
    config.Version = "V1";

});

var app = builder.Build();


app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>();
    app.UseOpenApi();
    app.UseSwaggerUi(config =>
    {
        config.DocumentTitle = "UserAPI";
        config.Path="/swagger";
        config.DocumentPath = "/swagger/{documentName}/swagger.json";
        config.DocExpansion= "list";
    }
    );


}

app.MapPost("/users/register", async (UserRegisterDto dto, UserDb db) =>
{   
    //Checks if user already exists
    var checkUser = await db.Users.AnyAsync(u => u.UserName == dto.UserName);
    if (checkUser)
        return Results.Conflict("Username already used."); 
    
    //Hashes password, creates new user and gives a response using DTO
    string hashPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password);
    var user = new User
    {
      Name = dto.Name,
      UserName = dto.UserName,
      PasswordHash = hashPassword  
    };
    
    db.Users.Add(user);
    await db.SaveChangesAsync();
    var response = new UserResponseDto
    {
        Id = user.Id,
        Name = user.Name,
        UserName = user.UserName
    };

    return Results.Created($"/users/{user.Id}", response);
});


app.MapPost("/users/login", async  (UserLoginDto dto, UserDb db) =>
{
    try
    {
        //Checks if the username is on the database and checks if the password matches
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == dto.Username);
        if (user == null)
        {
            return Results.Json(
                new { message = "Wrong user or password" },
                statusCode: 401);
        }

        bool passwordMatch = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordMatch)
        {
            return Results.Json(
                new { message = "Wrong user or password" },
                statusCode: 401);
        }

        //Creates the token and creates a new session for the user
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:Secret"]!);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, user.UserName), new Claim("UserId", user.Id.ToString()) }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Results.Ok(new { success = true, msg = "Logged in.", Token = tokenHandler.WriteToken(token) });
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            message = "Problem trying to log in",
            error = ex.Message
        }, statusCode: 500);
    }
});

app.MapPost("/todoitems", async (TodoDto dto, HttpContext httpContext, TodoDb db) =>
{

    //Checks if the user is logged to post the task using httpContextExtensions class
    var userIdClaim = httpContext.User.FindFirst("UserId")?.Value;
    if (string.IsNullOrEmpty(userIdClaim))
        return Results.Unauthorized();
    int userId = int.Parse(userIdClaim);

    //Creates new task based on the user logged while returning the result with DTO
    var todo = new Todo
    {
        Name = dto.Name,
       	IsComplete = dto.IsComplete,
	    UserId = userId
    };
    db.Todos.Add(todo);
    await db.SaveChangesAsync();
    return Results.Created($"/todoitems/{todo.Id}", new TodoDto
    {
        Id = todo.Id,
        Name = todo.Name,
	    IsComplete = todo.IsComplete,
        UserId = todo.UserId
    });
}).RequireAuthorization();


app.MapPut("/todoitems/{id}", async (HttpContext httpContext, int id, TodoDb db, TodoPutDto todoPutDto) =>
{
    var userIdClaim = httpContext.User.FindFirst("UserId")?.Value;
    if (string.IsNullOrEmpty(userIdClaim))
        return Results.Unauthorized();
    int userId = int.Parse(userIdClaim);

    var todo = await db.Todos.FindAsync(id);
    if (todo == null)
        return Results.NotFound($"Id {id} not found.");
    if (todo.UserId != userId)
        return Results.Forbid(); 

    todo.Name = todoPutDto.Name;
    todo.IsComplete = todoPutDto.IsComplete;
    await db.SaveChangesAsync();

    var todoDto = new TodoDto
    {
        Id = todo.Id,
        Name = todo.Name,
        IsComplete = todo.IsComplete,
        UserId = todo.UserId
    };

    return Results.Ok(todoDto);
}).RequireAuthorization();

app.MapGet("/todoitems", async (HttpContext httpContext, TodoDb db) =>
{
    //Gets the userId from the token
    var userIdClaim = httpContext.User.FindFirst("UserId")?.Value;
    if (string.IsNullOrEmpty(userIdClaim))
        return Results.Unauthorized();
    int userId = int.Parse(userIdClaim);

    //Gets the tasks from the specific user
    var todos = await db.Todos
        .Where(t => t.UserId == userId)
        .Select(t => new TodoDto
        {
            Id = t.Id,
            Name = t.Name,
            IsComplete = t.IsComplete,
            UserId = t.UserId
        })
        .OrderByDescending(t => t.Id)
        .ToListAsync();

    return Results.Ok(todos);
}).RequireAuthorization();

app.MapDelete("/todoitems/{id}", async (int id, HttpContext httpContext, TodoDb db) =>
{
    var userIdClaim = httpContext.User.FindFirst("UserId")?.Value;
    if (string.IsNullOrEmpty(userIdClaim))
        return Results.Unauthorized();
    int userId = int.Parse(userIdClaim);

    var todo = await db.Todos.FindAsync(id);
    if (todo is null) return Results.NotFound();

    if (todo.UserId != userId)
    {
        return Results.Forbid();  // 403 - Forbidden
    }
    db.Todos.Remove(todo);
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.MapPut("/users/{id}", async (int id, User inputUser, UserDb db) =>
{
    var user = await db.Users.FindAsync(id);
    if (user is null) return Results.NotFound();
    user.Name = inputUser.Name;
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization();

app.Run();