import { Component, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
})
export class ConfirmComponent {
  @Input() titulo: string = 'Confirmar ação';
  @Input() mensagem: string = 'Tem certeza que deseja continuar?';
  @Input() visivel: boolean = false;

  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado = new EventEmitter<void>();

  confirmar() {
    this.confirmado.emit();
  }

  cancelar() {
    this.cancelado.emit();
  }
}
