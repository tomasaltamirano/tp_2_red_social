import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/enviroment';
import { ChartDirective } from '../../../shared/directives/chart.directive';
import { RecortarPipe } from '../../../shared/pipes/recortar';

interface DatoEstadistico {
  label: string;
  cantidad: number;
}

@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule, ChartDirective],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.scss',
})
export class DashboardEstadisticas implements OnInit {
  private http = inject(HttpClient);
  private recortar = new RecortarPipe();
  private apiUrl = `${environment.apiUrl.replace(/\/$/, '')}/estadisticas`;

  desde = '';
  hasta = '';
  cargando = signal(false);

  porUsuario = signal<DatoEstadistico[]>([]);
  porDia = signal<DatoEstadistico[]>([]);
  porPublicacion = signal<DatoEstadistico[]>([]);

  labelsUsuario = computed(() => this.porUsuario().map((i) => i.label));
  datosUsuario = computed(() => this.porUsuario().map((i) => i.cantidad));

  labelsDia = computed(() => this.porDia().map((i) => i.label));
  datosDia = computed(() => this.porDia().map((i) => i.cantidad));

  labelsPublicacion = computed(() =>
    this.porPublicacion().map((i) => this.recortar.transform(i.label, 25)),
  );
  datosPublicacion = computed(() => this.porPublicacion().map((i) => i.cantidad));

  ngOnInit() {
    this.ultimosDias(30);
  }

  ultimosDias(dias: number) {
    const fin = new Date();
    const ini = new Date();
    ini.setDate(fin.getDate() - dias);
    this.desde = ini.toISOString().slice(0, 10);
    this.hasta = fin.toISOString().slice(0, 10);
    this.cargar();
  }

  cargar() {
    if (!this.desde || !this.hasta) return;
    this.cargando.set(true);
    const params = new HttpParams().set('desde', this.desde).set('hasta', this.hasta);

    forkJoin({
      u: this.http.get<DatoEstadistico[]>(`${this.apiUrl}/publicaciones-por-usuario`, { params }),
      d: this.http.get<DatoEstadistico[]>(`${this.apiUrl}/comentarios`, { params }),
      p: this.http.get<DatoEstadistico[]>(`${this.apiUrl}/comentarios-por-publicacion`, { params }),
    }).subscribe({
      next: ({ u, d, p }) => {
        this.porUsuario.set(u);
        this.porDia.set(d);
        this.porPublicacion.set(p);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
