import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';
import Chart, { ChartConfiguration } from 'chart.js/auto';
import { ThemeService } from '../../core/services/theme';

@Directive({
  selector: 'canvas[appChart]',
  standalone: true,
})
export class ChartDirective implements OnDestroy {
  private canvas = inject<ElementRef<HTMLCanvasElement>>(ElementRef).nativeElement;
  private theme = inject(ThemeService);
  private chart: Chart | null = null;

  tipo = input.required<'bar' | 'line' | 'doughnut'>();
  labels = input.required<string[]>();
  datos = input.required<number[]>();
  titulo = input<string>('Cantidad');

  private colores = ['#8c5a32', '#c8a265', '#2e6f40', '#b93829', '#d9822b', '#4f6d7a', '#a3685f'];

  constructor() {
    effect(() => {
      const tipo = this.tipo();
      const labels = this.labels();
      const data = this.datos();
      const label = this.titulo();
      const isDark = this.theme.isDark();

      this.dibujar(tipo, labels, data, label, isDark);
    });
  }

  private dibujar(
    type: 'bar' | 'line' | 'doughnut',
    labels: string[],
    data: number[],
    label: string,
    isDark: boolean,
  ) {
    this.chart?.destroy();
    if (!data.length) return;

    const textColor = isDark ? '#f3efe6' : '#181615';
    const gridColor = isDark ? '#332d27' : '#e2dcd0';
    const isDonut = type === 'doughnut';

    const config: ChartConfiguration = {
      type,
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            backgroundColor: isDonut ? this.colores : '#8c5a32',
            borderColor: isDonut ? (isDark ? '#1b1815' : '#fcfbf9') : '#c8a265',
            borderWidth: 2,
            tension: 0.3,
            fill: type === 'line',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: isDonut, position: 'bottom', labels: { color: textColor } },
        },
        scales: isDonut
          ? undefined
          : {
              x: { ticks: { color: textColor }, grid: { display: false } },
              y: {
                beginAtZero: true,
                ticks: { color: textColor, precision: 0 },
                grid: { color: gridColor },
              },
            },
      },
    };

    this.chart = new Chart(this.canvas, config);
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }
}
