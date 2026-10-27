import { Component, Input, OnInit, SimpleChanges, ViewChild, inject, effect } from '@angular/core';
import { ThemeService } from '../../../../../../shared/services/theme.service';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-statistics',
  imports: [BaseChartDirective],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class Statistics {
  private readonly theme = inject(ThemeService);
  public pieChartOptions: ChartConfiguration['options'] = {};
  constructor() {
    effect(() => {
      const dark = this.theme.mode() === 'dark';
      const color = dark ? '#c6d3e5' : '#53657d';
      const grid = dark ? '#34445c' : '#e5e7eb';
      this.barChartOptions = {
        responsive: true,
        color,
        plugins: {
          title: { display: true, text: 'Cantidades por Usuario', color },
          legend: { labels: { color } },
        },
        scales: {
          x: { ticks: { color }, grid: { color: grid } },
          y: { ticks: { color }, grid: { color: grid } },
        },
      };
      this.pieChartOptions = {
        responsive: true,
        color,
        plugins: { legend: { labels: { color } } },
      };
    });
  }
  @Input() data: Array<any> = [];
  @Input() stats: any = null;
  private readonly chartColors = [
    '#1e3a8a',
    '#2563eb',
    '#0f766e',
    '#16a34a',
    '#f59e0b',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
    '#be123c',
    '#4b5563',
  ];

  // Configuración del gráfico de Barras (Usuarios)
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { title: { display: true, text: 'Cantidades por Usuario' } },
  };
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Configuración del gráfico de Torta (Secciones)
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stats'] && changes['stats'].currentValue) {
      this.processStats();
      return;
    }

    if (changes['data'] && changes['data'].currentValue) {
      this.processData();
    }
  }

  private colorsFor(length: number) {
    return Array.from({ length }, (_, index) => this.chartColors[index % this.chartColors.length]);
  }

  processStats() {
    const byUser = this.stats?.byUser || [];
    const bySection = this.stats?.bySection || [];

    this.barChartData = {
      labels: byUser.map((item: any) => item.label),
      datasets: [
        {
          data: byUser.map((item: any) => Number(item.value) || 0),
          label: 'Total Escaneado',
          backgroundColor: '#1e3a8a',
        },
      ],
    };

    this.pieChartData = {
      labels: bySection.map((item: any) => item.label),
      datasets: [
        {
          data: bySection.map((item: any) => Number(item.value) || 0),
          backgroundColor: this.colorsFor(bySection.length),
        },
      ],
    };
  }

  processData() {
    const usuarios: any = {};
    const secciones: any = {};

    this.data.forEach((item) => {
      // Sumar por Usuario
      usuarios[item.user] = (usuarios[item.user] || 0) + parseInt(item.total_cantidad);
      // Sumar por Sección
      const secName = `Sección ${item.section_name}`;
      secciones[secName] = (secciones[secName] || 0) + parseInt(item.total_cantidad);
    });

    // Cargar datos a Bar Chart
    this.barChartData = {
      labels: Object.keys(usuarios),
      datasets: [
        { data: Object.values(usuarios), label: 'Total Escaneado', backgroundColor: '#1e3a8a' },
      ],
    };

    // Cargar datos a Pie Chart
    this.pieChartData = {
      labels: Object.keys(secciones),
      datasets: [
        {
          data: Object.values(secciones),
          backgroundColor: this.colorsFor(Object.keys(secciones).length),
        },
      ],
    };
  }
}
