public class TodoDto
{
    public int Id {get; set;}
    public string? Name {get; set;}
    public bool IsComplete{get; set;}
    public int UserId { get; set; }


}

public class TodoPutDto
{
    public string Name { get; set; } = string.Empty;
    public bool IsComplete { get; set; }
}