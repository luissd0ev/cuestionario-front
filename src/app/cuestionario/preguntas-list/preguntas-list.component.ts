import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { PreguntaListService } from './preguntas-list.service';
import { Pregunta, Respuesta } from './preguntas-list.interface';

interface ValorPonderadoPorPilar {
  prePilId: number;
  valorPonderado: number;
}

@Component({
  selector: 'preguntas-list',
  templateUrl: 'preguntas-list.component.html',
  ////Se podrían definir estilos de la siguiente maner
  styleUrl: './preguntas-list.component.css',
})


export class PreguntasListComponent implements OnInit {

  
  preguntas: Pregunta[] = [];
  preguntasVisibles: Pregunta[] = [];
  valoresPonderadosPorPilar: ValorPonderadoPorPilar[] = [];
  pilarActualIndex: number = 0;

  constructor(private preguntaListService: PreguntaListService) {}

  ngOnInit(): void {
    this.searchPreguntas();
  }

  calcularValoresPonderados() {
    // Agrupar las preguntas por prePilId
    const preguntasPorPilar: Record<number, Pregunta[]> = this.preguntas.reduce(
      (acc: Record<number, Pregunta[]>, pregunta: Pregunta) => {
        const prePilId = pregunta.prePilId;
        if (!acc[prePilId]) {
          acc[prePilId] = [];
        }
        acc[prePilId].push(pregunta);
        return acc;
      },
      {}
    );

    // Calcular los valores ponderados por pilar
    this.valoresPonderadosPorPilar = [];
    for (const prePilId in preguntasPorPilar) {
      const preguntas = preguntasPorPilar[prePilId];

      const totalValorEvaluacion = preguntas.reduce((acc, pregunta) => {
        // Solo considerar las respuestas seleccionadas
        const totalValorPregunta = pregunta.respuesta
          .filter((res) => res.seleccionado) // Asegúrate de tener una propiedad para identificar respuestas seleccionadas
          .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
        const promedioValorPregunta =
          totalValorPregunta /
          pregunta.respuesta.filter((res) => res.seleccionado).length;
        return acc + (isNaN(promedioValorPregunta) ? 0 : promedioValorPregunta); // Evitar NaN si no hay respuestas seleccionadas
      }, 0);

      const promedioPilar = totalValorEvaluacion / preguntas.length;
      this.valoresPonderadosPorPilar.push({
        prePilId: Number(prePilId),
        valorPonderado: promedioPilar,
      });
    }

    console.log(this.valoresPonderadosPorPilar); // Mostrar los valores ponderados por pilar
  }

  desactivarPreguntasHijas(pregunta: Pregunta): void {
    this.preguntasVisibles = this.preguntasVisibles.filter(
      (p) => p.prePreIdTrigger !== pregunta.preId
    );
  }

  irAPilarAnterior(): void {
    if (this.pilarActualIndex > 0) {
      this.pilarActualIndex--;
    }
  }

  irAPilarSiguiente(): void {
    if (this.pilarActualIndex < this.valoresPonderadosPorPilar.length - 1) {
      this.pilarActualIndex++;
    }
  }

  onRespuestaSeleccionada(pregunta: Pregunta, respuesta: Respuesta): void {
    if (pregunta.preTipId === 3) {
      this.desactivarPreguntasHijas(pregunta);
    }

    const nuevasPreguntas = this.preguntas.filter(
      (p) =>
        p.prePreIdTrigger === pregunta.preId &&
        p.preResIdTrigger === respuesta.resId
    );

    // Inserta las nuevas preguntas después de la pregunta actual
    const index = this.preguntasVisibles.indexOf(pregunta) + 1;
    for (const nuevaPregunta of nuevasPreguntas) {
      if (!this.preguntasVisibles.includes(nuevaPregunta)) {
        this.preguntasVisibles.splice(index, 0, nuevaPregunta);
      }
    }

    // Marcar la respuesta como seleccionada
    pregunta.respuesta.forEach((res) => (res.seleccionado = res === respuesta));

    // Recalcular los valores ponderados
    this.calcularValoresPonderados();
  }

  obtenerPreguntasDelPilarActual(): Pregunta[] {
    const pilarActual = this.valoresPonderadosPorPilar[this.pilarActualIndex];
    return this.preguntasVisibles.filter(
      (pregunta) => pregunta.prePilId === pilarActual.prePilId
    );
  }

  searchPreguntas() {
    this.preguntaListService.searchPreguntas().subscribe({
      next: (response) => {
        console.log('Se muestra el resultado de las preguntas');
        console.log(response);
        this.preguntas = response;
        this.preguntasVisibles = this.preguntas
          .sort((a, b) => a.prePilId - b.prePilId)
          .filter((p) => !p.prePreIdTrigger);

        console.log('Se muestra tu array ordenado:');
        console.log(
          this.preguntas
            .sort((a, b) => a.prePilId - b.prePilId)
            .filter((p) => !p.prePreIdTrigger)
        );
        this.calcularValoresPonderados();
      },
      error: (error) => {
        console.log('error al ejecutar la respuesta');
        console.log(error);
      },
    });
  }
}
