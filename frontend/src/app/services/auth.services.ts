import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
export interface UserCredentials {
  userName: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    userName: string;
    name?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_DATA_KEY = 'user_data';


  private readonly tokenSignal = signal<string | null>(this.getTokenFromStorage());

  private readonly userSignal = signal<any | null>(this.getUserFromStorage());

  readonly isLoggedIn = computed(() => {
    const token = this.tokenSignal();
    return !!token;
  });

  readonly currentUser = computed(() => this.userSignal());

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.updateState();
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getUserFromStorage(): any | null {
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private updateState(): void {
    const token = this.getTokenFromStorage();
    const user = this.getUserFromStorage();
    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  register(credentials: UserCredentials): Observable<any> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.post(`${this.apiUrl}/register`, credentials).pipe(
      tap({
        next: () => this.isLoading.set(false),
        error: () => this.isLoading.set(false)
      }),
      catchError(this.handleError.bind(this))
    );
  }

  login(credentials: { userName: string; password: string }): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap({
        next: (response) => {
          this.isLoading.set(false);
          const token = response.token || (response as any).Token;
          if (token) {
            this.setSession(token, response.user || { userName: credentials.userName });
          }
        },
        error: () => this.isLoading.set(false)
      }),
      catchError(this.handleError.bind(this))
    );
  }

  private setSession(token: string, user: any): void {
    // Salva no localStorage
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));

    this.tokenSignal.set(token);
    this.userSignal.set(user);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoading.set(false);
    let errorMessage = 'Problema com a operação.';

    if (error.error) {
      if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.msg) {
        errorMessage = error.error.msg;
      }
    }

    switch (error.status) {
      case 401:
        errorMessage = error.error?.message || 'Usuário ou senha inválidos';
        break;
      case 400:
        errorMessage = error.error?.message || 'Usuário já existe, utilize outro nome de usuário';
        break;
      case 0:
        errorMessage = 'Erro de conexão. Verifique sua internet.';
        break;
    }

    this.errorMessage.set(errorMessage);
    console.error('AuthService Error:', error);

    return throwError(() => ({
      message: errorMessage,
      status: error.status,
      error: error.error
    }));
  }

  logout(): void {
    // Remove do localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);

    this.tokenSignal.set(null);
    this.userSignal.set(null);

    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getUser(): any | null {
    return this.userSignal();
  }

  hasValidToken(): boolean {
    return this.isLoggedIn();
  }
}
