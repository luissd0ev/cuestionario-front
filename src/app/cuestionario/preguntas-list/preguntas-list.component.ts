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

@Component({
  selector: 'preguntas-list',
  templateUrl: 'preguntas-list.component.html',
  ////Se podrían definir estilos de la siguiente maner
  styleUrl: './preguntas-list.component.css',
})



export class PreguntasListComponent implements OnInit {
  preguntas: Pregunta[] = [];
  preguntasVisibles: Pregunta[] = [];

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
        this.preguntasVisibles = this.preguntas.filter(
          (p) => !p.prePreIdTrigger
        );
      },
      error: (error) => {
        console.log('error al ejecutar la respuesta');
        console.log(error);
      },
    });
  }



  agruparPreguntasPorPilar() {
    const preguntasAgrupadas = this.preguntas.reduce((acc: any, pregunta) => {
      const { prePilId } = pregunta;
      if (!acc[prePilId]) {
        acc[prePilId] = [];
      }
      acc[prePilId].push(pregunta);
      return acc;
    }, {});

    this.preguntasVisibles = preguntasAgrupadas;
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

    const index = this.preguntasVisibles.findIndex(p => p.preId === pregunta.preId);

    nuevasPreguntas.forEach(nuevaPregunta => {
        const yaVisible = this.preguntasVisibles.some(p => p.preId === nuevaPregunta.preId);
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
