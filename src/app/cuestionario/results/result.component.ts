import { Component, OnInit } from '@angular/core';
import { Pregunta } from '../preguntas-list/preguntas-list.interface';
import { Router } from '@angular/router';
import { PreguntaListService } from '../preguntas-list/preguntas-list.service';

interface ValorPonderadoPorPilar {
  prePilId: number;
  valorPonderado: number;
}

@Component({
  selector: 'results',
  templateUrl: 'result.component.html',
  styleUrls: ['./result.component.css'],
})
export class ResultComponent implements OnInit {
  preguntas: Pregunta[] = [];
  preguntasVisibles: Pregunta[] = [];
  valoresPonderadosPorPilar: ValorPonderadoPorPilar[] = [];
  pilarActualIndex: number = 0;

  constructor(
    private preguntaListService: PreguntaListService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.searchPreguntas();
  }

  calcularValorPonderado(pregunta: Pregunta): number {
    const totalValorEvaluacion = pregunta.respuesta
      .filter((res) => res.seleccionado)
      .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
    const promedioValorPregunta =
      totalValorEvaluacion /
      pregunta.respuesta.filter((res) => res.seleccionado).length;
    return isNaN(promedioValorPregunta) ? 0 : promedioValorPregunta;
  }



  searchPreguntas() {
    this.preguntaListService.searchPreguntas().subscribe({
      next: (response) => {
        this.preguntas = response.map(pregunta => {
          return {
            ...pregunta,
            contestaciones: pregunta.contestaciones.length > 0 ? pregunta.contestaciones : [{
              corId: 0,
              corResId: 0,
              corPreId: pregunta.preId,
              corValor: '',
              corImagen: '',
              corNoContesto: false
            }]
          };
        });

        this.preguntas.forEach((pregunta) => {
          pregunta.respuesta.forEach((res) => {
            res.seleccionado = pregunta.contestaciones.some(
              (cont) =>
                cont.corResId === res.resId && cont.corPreId === pregunta.preId
            );
            if (pregunta.preTipId === 3) {
              const contestacion = pregunta.contestaciones.find(
                (cont) => cont.corPreId === pregunta.preId
              );
              if (contestacion) {
                res.resValor = contestacion.corValor;
              }
            }
          });
        });

        this.calcularValoresPonderados();
      },
      error: (error) => {
        console.log('error al ejecutar la respuesta');
        console.log(error);
      }
    });
  }

  calcularValoresPonderados() {

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


    this.valoresPonderadosPorPilar = [];
    
    
    for (const prePilId in preguntasPorPilar) {
      const preguntas = preguntasPorPilar[prePilId];

      const totalValorEvaluacion = preguntas.reduce((acc, pregunta) => {
        const totalValorPregunta = pregunta.respuesta
          .filter((res) => res.seleccionado)
          .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
        const promedioValorPregunta =
          totalValorPregunta /
          pregunta.respuesta.filter((res) => res.seleccionado).length;
        return acc + (isNaN(promedioValorPregunta) ? 0 : promedioValorPregunta);
      }, 0);

      const promedioPilar = totalValorEvaluacion / preguntas.length;
      this.valoresPonderadosPorPilar.push({
        prePilId: Number(prePilId),
        valorPonderado: promedioPilar,
      });
    }
  }


  volver() {
    this.router.navigate(['/preguntas']);
  }

}
