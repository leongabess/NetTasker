import { Injectable, inject, signal, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AuthService } from './auth.services';
import { UserUpdateService } from './userUpdate.services';

export interface UserState {
  id: number;
  name: string;
  userName: string;
  imageUrl: SafeUrl | null;
}

@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private readonly authService = inject(AuthService);
  private readonly userUpdateService = inject(UserUpdateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly _editando = signal(false);
  private readonly _nomeEditando = signal('');
  private readonly _imagemSelecionada = signal<File | null>(null);
  private readonly _previewUrl = signal<SafeUrl | null>(null);
  private readonly _atualizando = signal(false);
  private readonly _imagemUrl = signal<SafeUrl | null>(null);
  private readonly _erro = signal('');


  readonly editando = this._editando.asReadonly();
  readonly nomeEditando = this._nomeEditando.asReadonly();
  readonly imagemSelecionada = this._imagemSelecionada.asReadonly();
  readonly previewUrl = this._previewUrl.asReadonly();
  readonly atualizando = this._atualizando.asReadonly();
  readonly imagemUrl = this._imagemUrl.asReadonly();
  readonly erro = this._erro.asReadonly();

  //Dados do usuário atual
  readonly usuarioAtual = computed(() => {
    const user = this.authService.getUser();
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      userName: user.userName,
      imageUrl: this._imagemUrl()
    };
  });

  readonly nomeExibicao = computed(() => {
    const user = this.authService.getUser();
    return user?.name || user?.userName || 'Usuário';
  });

  readonly userId = computed(() => {
    const user = this.authService.getUser();
    return user?.id || 0;
  });


  //Métodos para edição
  carregarImagem(): void {
    const userId = this.userId();
    if (!userId) return;

    this.userUpdateService.getUserImage(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this._imagemUrl.set(this.sanitizer.bypassSecurityTrustUrl(url));
        },
        error: (error) => {
          if (error.status !== 404) {
            console.error('Erro ao carregar imagem:', error);
          }
          this._imagemUrl.set(null);
        }
      });
  }

  iniciarEdicao(): void {
    const user = this.authService.getUser();
    if (!user) return;

    this._nomeEditando.set(user.name || user.userName || '');
    this._editando.set(true);
    this._imagemSelecionada.set(null);
    this._previewUrl.set(null);
    this._erro.set('');
  }

  atualizarNomeEditando(nome: string): void {
    this._nomeEditando.set(nome);
  }

  cancelarEdicao(): void {
    this._editando.set(false);
    this._nomeEditando.set('');
    this._imagemSelecionada.set(null);
    this._previewUrl.set(null);
    this._erro.set('');
  }

  selecionarImagem(file: File | null): { valido: boolean; mensagem?: string } {
    if (!file) {
      this._imagemSelecionada.set(null);
      this._previewUrl.set(null);
      return { valido: true };
    }

    //Validação de acordo com o backend
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this._erro.set('Tipo de arquivo inválido. Apenas JPEG e PNG são permitidos.');
      this._imagemSelecionada.set(null);
      this._previewUrl.set(null);
      return { valido: false, mensagem: 'Tipo inválido' };
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this._erro.set('O tamanho do arquivo excede o limite de 5 MB.');
      this._imagemSelecionada.set(null);
      this._previewUrl.set(null);
      return { valido: false, mensagem: 'Arquivo muito grande' };
    }

    this._imagemSelecionada.set(file);
    this._erro.set('');

    //Preview
    const reader = new FileReader();
    reader.onload = () => {
      this._previewUrl.set(this.sanitizer.bypassSecurityTrustUrl(reader.result as string));
    };
    reader.readAsDataURL(file);

    return { valido: true };
  }

  salvarEdicao(): void {
    const userId = this.userId();
    if (!userId) {
      this._erro.set('Usuário não identificado.');
      return;
    }

    const novoNome = this._nomeEditando().trim();
    if (!novoNome) {
      this._erro.set('O nome não pode estar vazio.');
      return;
    }

    const imagem = this._imagemSelecionada();
    this._atualizando.set(true);
    this._erro.set('');

    this.userUpdateService.updateUser(userId, novoNome, imagem)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const user = this.authService.getUser();
          if (user) {
            user.name = novoNome;
          }

          if (imagem) {
            this.carregarImagem();
          }

          this.cancelarEdicao();
          this._erro.set('Usuário atualizado com sucesso!');

          setTimeout(() => {
            if (this._erro() === 'Usuário atualizado com sucesso!') {
              this._erro.set('');
            }
          }, 3000);
        },
        error: () => {
          this._atualizando.set(false);
        }
      });
  }


  destroy(): void {
    //Limpar url
    const currentUrl = this._imagemUrl();
    if (currentUrl) {
    }
  }
}
