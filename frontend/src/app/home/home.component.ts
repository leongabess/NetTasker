import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.services';
import { TodoService, Todo, TodoCreateDto, TodoUpdateDto } from '../services/todo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  todos: Todo[] = [];
  newTodoName: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  currentPage: number = 1;
  itemsPerPage: number = 5;
  currentFilter: 'all' | 'pending' | 'completed' = 'all';
  updatingTodoId: number | null = null;

  constructor(
    private authService: AuthService,
    private todoService: TodoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    //Checar se usuário está logado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadTodos();
  }

  loadTodos(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.todoService.getTodos().subscribe({
      next: (todos) => {
        this.todos = todos.sort((a, b) => b.id - a.id);
        this.isLoading = false;
        this.currentPage = 1;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
        this.errorMessage = 'Erro ao carregar tarefas. Tente novamente.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addTodo(): void {
    const name = this.newTodoName.trim();
    if (!name) {
      this.errorMessage = 'Por favor, digite um nome para a tarefa.';
      this.cdr.detectChanges();
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage = 'Usuário não identificado. Faça login novamente.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const newTodo: TodoCreateDto = {
      name: name,
      isComplete: false,
      userId: user.id
    };
    this.todoService.createTodo(newTodo).subscribe({
      next: (createdTodo) => {
        this.todos = [createdTodo, ...this.todos];
        this.loadTodos();
        this.newTodoName = '';
        this.currentPage = 1;
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      },
      error: (error) => {
        console.error('Erro ao adicionar tarefa:', error);
        this.errorMessage = 'Erro ao adicionar tarefa. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  toggleComplete(todo: Todo): void {
    // Evitar cliques enquanto atualiza
    if (this.updatingTodoId === todo.id) {
      return;
    }

    this.updatingTodoId = todo.id;
    this.errorMessage = '';

    const updatedTodo: TodoUpdateDto = {
      name: todo.name,
      isComplete: !todo.isComplete
    };

    this.todoService.updateTodo(todo.id, updatedTodo).subscribe({
      next: (updated) => {
        const index = this.todos.findIndex(t => t.id === updated.id);
        if (index !== -1) {
          this.todos[index] = updated;
        }
        this.updatingTodoId = null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao atualizar tarefa:', error);
        this.errorMessage = 'Erro ao atualizar tarefa. Tente novamente.';
        this.updatingTodoId = null;
      }
    });
  }

  deleteTodo(id: number): void {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.todoService.deleteTodo(id).subscribe({
      next: () => {
        this.todos = this.todos.filter(t => t.id !== id);
        this.loadTodos();
        setTimeout(() => {
          const totalPages = this.getTotalPages();
          if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = totalPages;
          }
          this.cdr.detectChanges();
        }, 100);
      },
      error: (error) => {
        console.error('Erro ao deletar tarefa:', error);
        this.errorMessage = 'Erro ao deletar tarefa. Tente novamente.';
        this.isLoading = false;
      }
    });
  }

  //Visualização da página
  getFilteredTodos(): Todo[] {
    if (!this.todos || this.todos.length === 0) {
      return [];
    }

    switch (this.currentFilter) {
      case 'pending':
        return this.todos.filter(todo => !todo.isComplete);
      case 'completed':
        return this.todos.filter(todo => todo.isComplete);
      default:
        return this.todos;
    }
  }

  getCurrentPageTodos(): Todo[] {
    const filtered = this.getFilteredTodos();
    if (filtered.length === 0) {
      return [];
    }
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    const filtered = this.getFilteredTodos();
    return Math.ceil(filtered.length / this.itemsPerPage) || 1;
  }

  getPages(): number[] {
    const total = this.getTotalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    const total = this.getTotalPages();
    if (page >= 1 && page <= total) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
  }

  goToLastPage(): void {
    this.currentPage = this.getTotalPages();
    this.cdr.detectChanges();
  }

  changeFilter(filter: 'all' | 'pending' | 'completed'): void {
    this.currentFilter = filter;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  trackByTodoId(index: number, todo: Todo): number {
    return todo.id; 
  }

  //Mostrar username e logout
  getUserName(): string {
    const user = this.authService.getUser();
    return user?.name || user?.userName || 'Usuário';
  }

  logout(): void {
    this.authService.logout();
  }
}
