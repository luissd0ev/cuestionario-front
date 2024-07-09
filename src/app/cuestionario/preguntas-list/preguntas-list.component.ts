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
  
  constructor(private preguntaListService: PreguntaListService) {}

  ngOnInit(): void {
    console.log('Implementando método OnInit');
    this.searchPreguntas();
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

                // Agrupar las preguntas por prePilId
       // Agrupar las preguntas por prePilId
    const preguntasPorPilar: Record<number, Pregunta[]> = this.preguntas.reduce((acc: Record<number, Pregunta[]>, pregunta: Pregunta) => {
      const prePilId = pregunta.prePilId;
      if (!acc[prePilId]) {
        acc[prePilId] = [];
      }
      acc[prePilId].push(pregunta);
      return acc;
    }, {});
   // Calcular los valores ponderados por pilar
   for (const prePilId in preguntasPorPilar) {
    const preguntas = preguntasPorPilar[prePilId];

    const totalValorEvaluacion = preguntas.reduce((acc, pregunta) => {
      const totalValorPregunta = pregunta.respuesta.reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
      const promedioValorPregunta = totalValorPregunta / pregunta.respuesta.length;
      return acc + promedioValorPregunta;
    }, 0);

    const promedioPilar = totalValorEvaluacion / preguntas.length;
    this.valoresPonderadosPorPilar.push({ prePilId: Number(prePilId), valorPonderado: promedioPilar });
  }

  console.log(this.valoresPonderadosPorPilar);
    //////

      },
      error: (error) => {
        console.log('error al ejecutar la respuesta');
        console.log(error);
      },
    });
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

    const index = this.preguntasVisibles.findIndex(
      (p) => p.preId === pregunta.preId
    );

    nuevasPreguntas.forEach((nuevaPregunta) => {
      const yaVisible = this.preguntasVisibles.some(
        (p) => p.preId === nuevaPregunta.preId
      );
      if (!yaVisible) {
        if (index !== -1) {
          this.preguntasVisibles.splice(index + 1, 0, nuevaPregunta);
        } else {
          this.preguntasVisibles.push(nuevaPregunta);
        }
      }
    });
  }

  desactivarPreguntasHijas(pregunta: Pregunta): void {
    this.preguntasVisibles = this.preguntasVisibles.filter(
      (p) => p.prePreIdTrigger !== pregunta.preId
    );
  }
}
