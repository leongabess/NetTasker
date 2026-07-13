public class TodoDto
{
    public int Id {get; set;}
    public required string Name {get; set;} = string.Empty;
    public bool IsComplete{get; set;}
    public int UserId { get; set; }


}

public class TodoPutDto
{
    public required string Name { get; set; } = string.Empty;
    public bool IsComplete { get; set; }
}