public class UserRegisterDto
{
    public required string Name {get; set;}
    public required string UserName {get; set;}
    public required string Password {get; set;}

}

public class UserResponseDto
{
    public int Id {get; set;}
    public required string Name {get; set;}
    public required string UserName {get; set;}
}