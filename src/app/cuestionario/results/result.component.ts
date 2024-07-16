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
        console.log('Se muestra el resultado de las preguntas');
        console.log(response);

        this.preguntas = response.map((pregunta) => ({
          ...pregunta,
          contestaciones:
            pregunta.contestaciones.length > 0
              ? pregunta.contestaciones
              : [
                  {
                    corId: 0,
                    corResId: 0, // Ajusta esto según sea necesario
                    corPreId: pregunta.preId,
                    corValor: '',
                    corImagen: '',
                    corNoContesto: false,
                  },
                ],
        }));

        this.preguntas.forEach((pregunta) => {
          pregunta.respuesta.forEach((res) => {
            res.seleccionado = pregunta.contestaciones.some(
              (cont) =>
                cont.corResId === res.resId && cont.corPreId === pregunta.preId
            );

            if (pregunta.preTipId === 3) {
              // Para preguntas abiertas, asignar el valor de la contestación
              const contestacion = pregunta.contestaciones.find(
                (cont) => cont.corPreId === pregunta.preId
              );
              if (contestacion) {
                res.resValor = contestacion.corValor;
              }
            }
          });
        });

      
        const preguntasMap = new Map<number, Pregunta[]>();
        this.preguntas.forEach((pregunta) => {
          if (!pregunta.prePreIdTrigger && !pregunta.preResIdTrigger) {
            if (!preguntasMap.has(pregunta.preId)) {
              preguntasMap.set(pregunta.preId, []);
            }
            preguntasMap.get(pregunta.preId)!.push(pregunta);
          }
        });

        // Agregar preguntas hijas al mapeo
        this.preguntas.forEach((pregunta) => {
          if (pregunta.prePreIdTrigger && pregunta.preResIdTrigger) {
            const padre = this.preguntas.find(
              (p) => p.preId === pregunta.prePreIdTrigger
            );
            if (
              padre &&
              padre.contestaciones.some(
                (cont) =>
                  cont.corPreId === pregunta.prePreIdTrigger &&
                  cont.corResId === pregunta.preResIdTrigger
              )
            ) {
              if (!preguntasMap.has(padre.preId)) {
                preguntasMap.set(padre.preId, []);
              }
              preguntasMap.get(padre.preId)!.push(pregunta);
            }
          }
        });

        // Convertir el mapeo en un array ordenado de preguntas visibles
        this.preguntasVisibles = [];
        preguntasMap.forEach((preguntas) => {
          this.preguntasVisibles.push(...preguntas);
        });

        console.log(this.preguntasVisibles);

        this.calcularValoresPonderados();
      },
      error: (error) => {
        console.log('error al ejecutar la respuesta');
        console.log(error);
      },
    });
  }

  calcularValoresPonderados(): void {

    console.log("MOSTRAR PREGUNTAS VISIBLES");
    console.log(this.preguntasVisibles);
    
    
    const preguntasPorPilar: Record<number, Pregunta[]> = this.preguntasVisibles.reduce(
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
    console.log("VALORES POR PILAR:");
    console.log(preguntasPorPilar);
    
    
    this.valoresPonderadosPorPilar = [];
  
    for (const prePilId in preguntasPorPilar) {
      const preguntas = preguntasPorPilar[prePilId];
  
      const totalValorEvaluacion = preguntas.reduce((acc, pregunta) => {
        const totalValorPregunta = pregunta.respuesta
          .filter((res) => res.seleccionado)
          .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
  
        const promedioValorPregunta = totalValorPregunta / pregunta.respuesta.filter((res) => res.seleccionado).length;
        return acc + (isNaN(promedioValorPregunta) ? 0 : promedioValorPregunta);
      }, 0);
  
      const promedioPilar = totalValorEvaluacion / preguntas.length;
  
      this.valoresPonderadosPorPilar.push({
        prePilId: Number(prePilId),
        valorPonderado: promedioPilar,
      });
    }
  
    console.log(this.valoresPonderadosPorPilar);
  }

  volver() {
    this.router.navigate(['/preguntas']);
  }
}
