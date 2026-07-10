import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from "@angular/router";
import { AuthService } from '../services/auth.services';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  registrationSuccess = false;
  errorMessage = '';
  showError = false;
  isLoading = false;
  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { 
    return this.registerForm.controls; 
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.registrationSuccess = false;
    this.showError = false;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    const registerData = {
      userName: this.registerForm.get('userName')?.value,
      password: this.registerForm.get('password')?.value,
      name: this.registerForm.get('name')?.value || this.registerForm.get('userName')?.value
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registro realizado', response);
        this.isLoading = false;
        this.registrationSuccess = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erro no registro', error);

        this.isLoading = false;
        this.registrationSuccess = false;
        this.errorMessage = error.message || 'Erro ao realizar registro. Tente novamente.';
        this.showError = true;
        this.cdr.detectChanges();

        console.log('Mensagem de erro:', this.errorMessage);

        setTimeout(() => {
          this.showError = false;
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  } 
}
