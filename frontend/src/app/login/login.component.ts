import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from "@angular/router";
import { AuthService } from "../services/auth.services";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{
  loginForm: FormGroup;
  submitted = false;
  loginSuccess = false;
  errorMessage = '';
  isLoading = false;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { 
    return this.loginForm.controls; 
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.loginSuccess = false;

    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;


    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login feito', response);
        this.isLoading = false;
        this.loginSuccess = true;

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      },
      error: (error) => {
        console.error('Erro no login:', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Login ou senha incorretos';
        } else if (error.status === 404) {
          this.errorMessage = 'Usuário não encontrado';
        } else {
          this.errorMessage = 'Erro ao fazer login. Tente novamente.';
        }
      }
    });
  }
}
