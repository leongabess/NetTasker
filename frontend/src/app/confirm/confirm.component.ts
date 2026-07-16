import { Component, signal, input, output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
})
export class ConfirmComponent {
  readonly titulo = input<string>('Confirmar ação');
  readonly mensagem = input<string>('Tem certeza que deseja continuar?');
  readonly visivel = input<boolean>(false);

  readonly confirmado = output<void>();
  readonly cancelado = output<void>();

  confirmar(): void {
    this.confirmado.emit();
  }

  cancelar(): void {
    this.cancelado.emit();
  }
}
