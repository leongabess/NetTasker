import { Component, OnInit, computed, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.services';
import { TodoService, Todo, TodoCreateDto, TodoUpdateDto } from '../services/todo.service';
import { ConfirmComponent } from '../confirm/confirm.component';

type TodoFilter = 'all' | 'pending' | 'completed';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly todoService = inject(TodoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly itemsPerPage = 5;
  private readonly deleteAnimationMs = 300; 

  readonly todos = signal<Todo[]>([]);
  readonly newTodoName = signal('');
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly currentPage = signal(1);
  readonly currentFilter = signal<TodoFilter>('all');

  readonly editandoTodoId = signal<number | null>(null);
  readonly editandoNome = signal('');
  readonly updatingTodoId = signal<number | null>(null);
  readonly todosRemovendo = signal<ReadonlySet<number>>(new Set());

  readonly mostrarModalConfirmacao = signal(false);
  private todoIdParaExcluir: number | null = null;

  readonly allCount = computed(() => this.todos().length);
  readonly pendingCount = computed(() => this.todos().filter(t => !t.isComplete).length);
  readonly completedCount = computed(() => this.todos().filter(t => t.isComplete).length);

  readonly filteredTodos = computed(() => {
    const todos = this.todos();
    switch (this.currentFilter()) {
      case 'pending': return todos.filter(t => !t.isComplete);
      case 'completed': return todos.filter(t => t.isComplete);
      default: return todos;
    }
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredTodos().length / this.itemsPerPage) || 1
  );

  readonly pages = computed(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  readonly currentPageTodos = computed(() => {
    const filtered = this.filteredTodos();
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  });

  readonly userName = computed(() => {
    const user = this.authService.getUser();
    return user?.name || user?.userName || 'Usuário';
  });

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadTodos();
  }

  loadTodos(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.todoService.getTodos()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (todos) => {
          this.todos.set([...todos].sort((a, b) => b.id - a.id));
          this.currentPage.set(1);
        },
        error: (error) => {
          console.error('Erro ao carregar tarefas:', error);
          this.errorMessage.set('Erro ao carregar tarefas. Tente novamente.');
        }
      });
  }

  addTodo(): void {
    const name = this.newTodoName().trim();
    if (!name) {
      this.errorMessage.set('Por favor, digite um nome para a tarefa.');
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      this.errorMessage.set('Usuário não identificado. Faça login novamente.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const newTodo: TodoCreateDto = { name, isComplete: false, userId: user.id };

    this.todoService.createTodo(newTodo)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (createdTodo) => {
          this.todos.update(todos => [createdTodo, ...todos]);
          this.newTodoName.set('');
          this.currentPage.set(1);
        },
        error: (error) => {
          console.error('Erro ao adicionar tarefa:', error);
          this.errorMessage.set('Erro ao adicionar tarefa. Tente novamente.');
        }
      });
  }

  toggleComplete(todo: Todo): void {
    if (this.updatingTodoId() === todo.id) {
      return;
    }

    this.updatingTodoId.set(todo.id);
    this.errorMessage.set('');

    const updatedTodo: TodoUpdateDto = { name: todo.name, isComplete: !todo.isComplete };

    this.todoService.updateTodo(todo.id, updatedTodo)
      .pipe(
        finalize(() => this.updatingTodoId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updated) => this.replaceTodo(updated),
        error: (error) => {
          console.error('Erro ao atualizar tarefa:', error);
          this.errorMessage.set('Erro ao atualizar tarefa. Tente novamente.');
        }
      });
  }

  //Edição 
  iniciarEdicao(todo: Todo): void {
    this.editandoTodoId.set(todo.id);
    this.editandoNome.set(todo.name);
  }

  cancelarEdicao(): void {
    this.editandoTodoId.set(null);
    this.editandoNome.set('');
  }

  salvarEdicao(todo: Todo): void {
    const nomeEditado = this.editandoNome().trim();

    if (!nomeEditado) {
      this.errorMessage.set('O nome da tarefa não pode estar vazio.');
      return;
    }

    if (nomeEditado === todo.name) {
      this.cancelarEdicao();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const updatedTodo: TodoUpdateDto = { name: nomeEditado, isComplete: todo.isComplete };

    this.todoService.updateTodo(todo.id, updatedTodo)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updated) => {
          this.replaceTodo(updated);
          this.cancelarEdicao();
        },
        error: (error) => {
          console.error('Erro ao editar tarefa:', error);
          this.errorMessage.set('Erro ao editar tarefa. Tente novamente.');
        }
      });
  }

  private replaceTodo(updated: Todo): void {
    this.todos.update(todos => todos.map(t => (t.id === updated.id ? updated : t)));
  }

  //Exclusão

  deleteTodo(id: number): void {
    this.todoIdParaExcluir = id;
    this.mostrarModalConfirmacao.set(true);
  }

  fecharModalConfirmacao(): void {
    this.mostrarModalConfirmacao.set(false);
  }

  confirmarExclusaoTodo(): void {
    const id = this.todoIdParaExcluir;
    if (id === null) {
      return;
    }

    this.todosRemovendo.update(set => new Set(set).add(id));
    this.fecharModalConfirmacao();

    setTimeout(() => {
      this.todoService.deleteTodo(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.todos.update(todos => todos.filter(t => t.id !== id));
            this.removerDaListaDeRemocao(id);
          },
          error: (error) => {
            console.error('Erro ao deletar todo:', error);
            this.errorMessage.set('Erro ao deletar tarefa. Tente novamente.');
            this.removerDaListaDeRemocao(id);
          }
        });
    }, this.deleteAnimationMs);
  }

  private removerDaListaDeRemocao(id: number): void {
    this.todosRemovendo.update(set => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  isRemovendo(id: number): boolean {
    return this.todosRemovendo().has(id);
  }

  //Filtros
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  changeFilter(filter: TodoFilter): void {
    this.currentFilter.set(filter);
    this.currentPage.set(1);
  }

  trackByTodoId(index: number, todo: Todo): number {
    return todo.id;
  }

  logout(): void {
    this.authService.logout();
  }
}
