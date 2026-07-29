import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from './auth.services';
import { environment } from '../environments/environment';


export interface UserUpdateDto {
  name: string;
  image?: File; 
}

@Injectable({ providedIn: 'root' }) 
export class UserUpdateService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private readonly apiUrl = `${environment.apiUrl}/users/`;

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoading.set(false);
    const message = error.error?.message || error.message || 'Erro desconhecido';
    this.errorMessage.set(message);
    return throwError(() => new Error(message));
  }


  getUserImage(userId: number): Observable<Blob> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    return this.http.get(`${this.apiUrl}${userId}/image`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob' 
    }).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.isLoading.set(false))
    );
  }


  updateUser(userId: number, name: string, imageFile: File | null): Observable<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    if (name) {
      formData.append('Name', name);
    }
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }

    return this.http.patch<void>(`${this.apiUrl}${userId}`, formData, {
      headers: this.getAuthHeaders() 
    }).pipe(
      catchError(this.handleError.bind(this)),
      finalize(() => this.isLoading.set(false))
    );
  }
}
