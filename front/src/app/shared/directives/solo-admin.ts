import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth';

@Directive({ selector: '[appSoloAdmin]', standalone: true })
export class SoloAdminDirective {
  private auth = inject(AuthService);
  private tpl = inject(TemplateRef);
  private vcr = inject(ViewContainerRef);
  private visible = false;

  constructor() {
    effect(() => {
      const esAdmin = this.auth.currentUser()?.perfil === 'administrador';
      if (esAdmin && !this.visible) {
        this.vcr.createEmbeddedView(this.tpl);
        this.visible = true;
      } else if (!esAdmin && this.visible) {
        this.vcr.clear();
        this.visible = false;
      }
    });
  }
}
