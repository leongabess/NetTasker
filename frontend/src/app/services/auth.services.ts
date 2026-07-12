import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5155/users';

  

  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  loggedIn$ = this.loggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  private hasToken(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  register(credentials: { userName: string, password: string, name?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, credentials).pipe(
      catchError(this.handleError)
    );
  }

  login(credentials: {userName: string, password: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        const token = response.token || response.Token;
        if (token) {
          //Saves token
          localStorage.setItem('auth_token', token);
          localStorage.setItem('user_data', JSON.stringify(response.user || { userName: credentials.userName }));
          this.loggedInSubject.next(true);
        }
      }), catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Problem with login.';
    console.log('Error status:', error.status);
    console.log('Error:', error.error);

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      }

      else if (error.error.message) {
        errorMessage = error.error.message;
      }

      else if (error.error.msg) {
        errorMessage = error.error.msg;
      }
    }

    //fallback se não receber mensagens
    if (error.status === 401) {
      errorMessage = error.error?.message || 'Usuário ou senha inválidos';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Usuário já existe, utilize outro nome de usuário';
    } else if (error.status === 0) {
      errorMessage = 'Erro de conexão. Verifique sua internet.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    console.log('Error message: ', errorMessage);
    console.error('Erro no login:', error);
    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    this.loggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUser(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }
}


