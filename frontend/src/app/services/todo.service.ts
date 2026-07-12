import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.services';

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
  private apiUrl = 'http://localhost:5155/todoitems';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }


  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Metódos similares aos do backend para manipulação das tarefas (GEt, POST, PUT, DELETE)
  getTodos(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  
  createTodo(todo: TodoCreateDto): Observable<Todo> {
    return this.http.post<Todo>(this.apiUrl, todo, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  
  updateTodo(id: number, todo: TodoUpdateDto): Observable<Todo> {
    return this.http.put<Todo>(`${this.apiUrl}/${id}`, todo, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  
  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('Erro no TodoService:', error);
    let errorMessage = 'Erro ao processar operação com tarefas';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Não autorizado. Faça login novamente.';
    } else if (error.status === 404) {
      errorMessage = 'Tarefa não encontrada.';
    }

    return throwError(() => new Error(errorMessage));
  }
}
