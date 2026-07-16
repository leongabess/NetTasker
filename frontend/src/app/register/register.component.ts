import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../services/auth.services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);


  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly showError = signal(false);
  readonly registrationSuccess = signal(false);
  readonly submitted = signal(false);


  readonly isLoggedIn = computed(() => this.authService.isLoggedIn());


  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }


  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }


  get f() {
    return this.registerForm.controls;
  }

  //Metódos
  onSubmit(): void {
    this.submitted.set(true);
    this.errorMessage.set('');
    this.registrationSuccess.set(false);
    this.showError.set(false);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);

    const registerData = {
      userName: this.registerForm.get('userName')?.value,
      password: this.registerForm.get('password')?.value,
      name: this.registerForm.get('name')?.value || this.registerForm.get('userName')?.value
    };

    this.authService.register(registerData)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          console.log('Registro realizado', response);
          this.registrationSuccess.set(true);

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          console.error('Erro no registro', error);
          this.registrationSuccess.set(false);
          this.errorMessage.set(error.message || 'Erro ao realizar registro. Tente novamente.');
          this.showError.set(true);

          setTimeout(() => {
            this.showError.set(false);
          }, 5000);
        }
      });
  }
}
