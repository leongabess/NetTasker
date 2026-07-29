// auth.services.ts - CORRIGIDO

import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface User {
  id: number;
  userName: string;
  name?: string;
}

export interface UserCredentials {
  userName: string;
  password: string;
  name?: string;
}

export interface LoginResponse {
  success: boolean;
  msg: string;
  Token: string;
  userId: number;
  userName: string;
  name: string;
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

  private readonly tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromStorage());
  private readonly userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());

  readonly tokenSignal = signal<string | null>(this.getTokenFromStorage());
  readonly userSignal = signal<User | null>(this.getUserFromStorage());

  readonly isLoggedIn = computed(() => {
    const token = this.tokenSignal();
    console.log('[AuthService] isLoggedIn computado, token:', !!token);
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

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  private updateState(): void {
    const token = this.getTokenFromStorage();
    const user = this.getUserFromStorage();

    console.log('[AuthService] updateState - token:', !!token, 'user:', !!user);

    this.tokenSignal.set(token);
    this.userSignal.set(user);
    this.tokenSubject.next(token);
    this.userSubject.next(user);
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

  login(credentials: { userName: string; password: string }): Observable<LoginResponse> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    console.log('[AuthService] Iniciando login para:', credentials.userName);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap({
        next: (response) => {
          console.log('[AuthService] Response bruto:', response);
          console.log('[AuthService] Response.Token:', response.Token);
          console.log('[AuthService] Response.token:', (response as any).token);

          this.isLoading.set(false);

          const token = response.Token || (response as any).token;
          console.log('[AuthService] Token extraído:', token ? 'sim' : 'não');

          if (token) {
            const user: User = {
              id: response.userId,
              userName: response.userName,
              name: response.name || response.userName
            };

            console.log('[AuthService] Usuário criado:', user);
            this.setSession(token, user);
          } else {
            console.error('[AuthService] Token não encontrado!');
            console.error('[AuthService] Response:', JSON.stringify(response));
          }
        },
        error: (error) => {
          console.error('[AuthService] Erro HTTP:', error);
          this.isLoading.set(false);
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  private setSession(token: string, user: User): void {
    console.log('[AuthService] setSession - salvando token e user');

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(user));

    this.tokenSignal.set(token);
    this.userSignal.set(user);
    this.tokenSubject.next(token);
    this.userSubject.next(user);

    console.log('[AuthService] setSession - signals atualizados');
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
    console.log('[AuthService] logout');

    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);

    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.tokenSubject.next(null);
    this.userSubject.next(null);

    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  getUser(): User | null {
    return this.userSignal();
  }

  hasValidToken(): boolean {
    return this.isLoggedIn();
  }
}
