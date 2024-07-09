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

  onRespuestaSeleccionada(pregunta: Pregunta, respuesta: Respuesta): void {
    if (pregunta.preTipId === 3) {
      this.desactivarPreguntasHijas(pregunta);
    }

    // Filtrar las nuevas preguntas basadas en la respuesta seleccionada
    const nuevasPreguntas = this.preguntas.filter(
      (p) =>
        p.prePreIdTrigger === pregunta.preId &&
        p.preResIdTrigger === respuesta.resId
    );

    // Encontrar el índice de la pregunta actual en la lista de preguntas visibles
    const index = this.preguntasVisibles.findIndex(
      (p) => p.preId === pregunta.preId
    );

    // Insertar las nuevas preguntas después de la pregunta actual si no están ya presentes
    nuevasPreguntas.forEach((nuevaPregunta) => {
      const yaVisible = this.preguntasVisibles.some(
        (p) => p.preId === nuevaPregunta.preId
      );
      if (!yaVisible) {
        if (index !== -1) {
          this.preguntasVisibles.splice(index + 1, 0, nuevaPregunta);
        } else {
          // Si la pregunta actual no se encuentra (lo cual no debería ocurrir), simplemente agregar al final
          this.preguntasVisibles.push(nuevaPregunta);
        }
      }
    });
  }

  private desactivarPreguntasHijas(pregunta: Pregunta): void {
    this.preguntasVisibles = this.preguntasVisibles.filter(
      (p) => p.prePreIdTrigger !== pregunta.preId
    );
  }
}
