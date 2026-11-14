import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

@Directive({
  selector: '[appCopyText]',
  standalone: true,
  host: { style: 'cursor: pointer', title: 'Click para copiar' },
})
export class CopyTextDirective {
  appCopyText = input.required<string>();
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  @HostListener('click')
  async copiar() {
    await navigator.clipboard.writeText(this.appCopyText());
    const original = this.el.innerText;
    this.el.innerText = '✓ ¡Copiado!';
    setTimeout(() => (this.el.innerText = original), 1000);
  }
}
