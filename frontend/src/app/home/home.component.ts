import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from "@angular/router";
import { AuthService } from '../services/auth.services';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})

export class HomeComponent implements OnInit {
  todoItems: any[] = [];
  loading = false;
  message = '';

  constructor(public authService: AuthService, private http: HttpClient, private router: Router)
  { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadTodoItems();
}

  loadTodoItems(): void {
    this.loading = true;
    this.message = 'Carregando tarefas...';

    this.http.get('http://localhost:5155/todoitems').subscribe({
      next: (response: any) => {
        console.log('Tarefas carregadas:', response);
        this.todoItems = response;
        this.loading = false;
        this.message = this.todoItems.length === 0 ? 'Nenhuma tarefa encontrada' : '';
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
        this.loading = false;

        if (error.status === 401) {
          this.message = 'Sessão expirada! Redirecionando...';
        } else {
          this.message = 'Erro ao carregar tarefas. Tente novamente.';
        }
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
