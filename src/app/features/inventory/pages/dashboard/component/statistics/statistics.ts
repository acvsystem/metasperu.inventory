import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-statistics',
  imports: [BaseChartDirective],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss',
})
export class Statistics {
  @Input() data: Array<any> = [];

  // Configuración del gráfico de Barras (Usuarios)
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { title: { display: true, text: 'Cantidades por Usuario' } }
  };
  public barChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  // Configuración del gráfico de Torta (Secciones)
  public pieChartData: ChartData<'pie'> = { labels: [], datasets: [] };

  ngOnInit() {
    
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && changes['data'].currentValue) {
      this.processData();
    }
  }


  processData() {
    const usuarios: any = {};
    const secciones: any = {};

    this.data.forEach(item => {
      // Sumar por Usuario
      usuarios[item.user] = (usuarios[item.user] || 0) + parseInt(item.total_cantidad);
      // Sumar por Sección
      const secName = `Sección ${item.section_name}`;
      secciones[secName] = (secciones[secName] || 0) + parseInt(item.total_cantidad);
    });

    // Cargar datos a Bar Chart
    this.barChartData = {
      labels: Object.keys(usuarios),
      datasets: [{ data: Object.values(usuarios), label: 'Total Escaneado', backgroundColor: '#1e3a8a' }]
    };

    // Cargar datos a Pie Chart
    this.pieChartData = {
      labels: Object.keys(secciones),
      datasets: [{ data: Object.values(secciones), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] }]
    };
  }
}