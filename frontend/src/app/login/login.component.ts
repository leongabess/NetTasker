import { Component, OnInit, ChangeDetectorRef} from '@angular/core';
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
  showError = false;
  isLoading = false;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {
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
    this.showError = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }


    this.isLoading = true;
    this.cdr.detectChanges(); 


    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        console.log('Login feito', response);
        this.isLoading = false;
        this.loginSuccess = true;
        this.errorMessage = '';
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
        this.loginSuccess = false;

        this.errorMessage = error.message || 'Problem trying to log in';
        this.showError = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.showError = false;
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }
}
