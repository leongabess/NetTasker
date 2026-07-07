import { Component } from '@angular/core';
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
  isLoading = false;
  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      userName: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { 
    return this.registerForm.controls; 
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';
    this.registrationSuccess = false;

    if (this.registerForm.invalid) {
      console.log('Inválido.');
      return;
    }

    this.isLoading = true;

    const registerData = {
      userName: this.registerForm.get('login')?.value,
      password: this.registerForm.get('password')?.value,
      name: this.registerForm.get('name')?.value || this.registerForm.get('login')?.value
    };

    this.authService.register(this.registerForm.value).subscribe({
      next: (response) => {
        console.log('Registro realizado', response);
        this.isLoading = false;
        this.registrationSuccess = true;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Erro no registro', error);
        this.isLoading = false;

        if (error.status === 409) {
          this.errorMessage = 'Este login já está em uso. Tente outro.';
        } else if (error.status === 400) {
          this.errorMessage = 'Dados inválidos. Verifique as informações.';
        } else {
          this.errorMessage = 'Erro ao criar conta. Tente novamente.';
        }
      }
    });

   /*console.log('Dados do registro:', this.registerForm.value);
    this.registrationSuccess = true;
    
    setTimeout(() => {
      this.registrationSuccess = false;
      this.registerForm.reset();
      this.submitted = false;
    }, 3000); */
  } 
}
