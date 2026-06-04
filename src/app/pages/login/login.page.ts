import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonButton, IonInput,
  IonSpinner, IonIcon, IonInputPasswordToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, lockClosedOutline, logInOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { UsuarioService } from '../../services/usuario';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonButton, IonInput,
    IonSpinner, IonIcon, IonInputPasswordToggle
  ]
})
export class LoginPage implements OnInit {
  loginValue = '';
  senha = '';
  loading = false;
  erro = '';

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {
    addIcons({ personOutline, lockClosedOutline, logInOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {}

  async entrar() {
    this.erro = '';

    if (!this.loginValue.trim() || !this.senha.trim()) {
      this.erro = 'Por favor, preencha usuário e senha.';
      return;
    }

    this.loading = true;
    try {
      const usuario = await this.usuarioService.login(
        this.loginValue.trim(),
        this.senha.trim()
      );

      if (usuario) {
        this.router.navigateByUrl('/menu', { replaceUrl: true });
      } else {
        this.erro = 'Login ou senha inválidos. Tente novamente.';
      }
    } catch (e: any) {
      this.erro = e.message || 'Erro ao realizar login.';
    } finally {
      this.loading = false;
    }
  }
}