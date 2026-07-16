import { Component, OnInit, signal, inject, DestroyRef, computed, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showError = signal(false);
  readonly loginSuccess = signal(false);
  readonly submitted = signal(false);


  readonly isLoggedIn = this.authService.isLoggedIn;


  loginForm: FormGroup;

  constructor() {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    effect(() => {
      if (this.isLoggedIn()) {
        console.log('Usuário logado detectado via effect!');
      }
    });
  }


  ngOnInit(): void {
    if (this.isLoggedIn()) {
      console.log('Usuário já está logado, redirecionando...');
      this.router.navigate(['/home']);
    }
  }


  get f() {
    return this.loginForm.controls;
  }

  //Metódos
  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.loginSuccess.set(false);
    this.showError.set(false);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.value)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          console.log('Login realizado com sucesso', response);
          this.loginSuccess.set(true);


          setTimeout(() => {
            if (this.isLoggedIn()) {
              console.log('Redirecionando para home...');
              this.router.navigate(['/home']);
            } else {
              console.error('Token não foi salvo corretamente');
              this.errorMessage.set('Erro ao salvar dados de login');
              this.showError.set(true);
            }
          }, 1000);
        },
        error: (error) => {
          console.error('Erro no login', error);
          this.loginSuccess.set(false);
          this.errorMessage.set(error.message || 'Erro ao realizar login. Tente novamente.');
          this.showError.set(true);

          setTimeout(() => {
            this.showError.set(false);
          }, 5000);
        }
      });
  }
}
