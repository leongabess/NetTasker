import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.services';

export interface Todo {
  id: number;
  name: string;
  isComplete: boolean;
  userId: number;
}

export interface TodoCreateDto {
  name: string;
  isComplete: boolean;
  userId: number;
}

export interface TodoUpdateDto {
  name: string;
  isComplete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly apiUrl = 'http://localhost:5155/todoitems';

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getTodos(): Observable<Todo[]> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.get<Todo[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  createTodo(todo: TodoCreateDto): Observable<Todo> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.post<Todo>(this.apiUrl, todo, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  updateTodo(id: number, todo: TodoUpdateDto): Observable<Todo> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.put<Todo>(`${this.apiUrl}/${id}`, todo, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  deleteTodo(id: number): Observable<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoading.set(false);
    let errorMessage = 'Erro ao processar operação com tarefas';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Não autorizado. Faça login novamente.';
      this.authService.logout();
    } else if (error.status === 404) {
      errorMessage = 'Tarefa não encontrada.';
    } else if (error.status === 0) {
      errorMessage = 'Erro de conexão. Verifique sua internet.';
    }

    this.errorMessage.set(errorMessage);
    console.error('TodoService Error:', error);

    return throwError(() => new Error(errorMessage));
  }
}
