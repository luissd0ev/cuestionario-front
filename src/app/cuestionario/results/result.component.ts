import { Component, OnInit } from '@angular/core';
import { Pregunta } from '../preguntas-list/preguntas-list.interface';
import { Router, ActivatedRoute } from '@angular/router';
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
  id: string = '';

  constructor(
    private preguntaListService: PreguntaListService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '0';
    console.log('SE MUESTRA EL ID DE ENCUESTA');
    console.log(this.id);

    this.searchPreguntas();
  }

  calcularValoresPonderados(): void {
    const preguntasPorPilar: Record<number, Pregunta[]> =
      this.preguntasVisibles.reduce(
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
    console.log('Preguntas por pilar');
    console.log(preguntasPorPilar);

    this.valoresPonderadosPorPilar = [];

    let totalPosibleEvaluar = 0;
    let totalPosiblePreguntasAbiertas = 0;
    let totalPosiblePreguntasMultiple = 0;
    let totalPosiblePreguntasCerradas = 0;

    for (const prePilId in preguntasPorPilar) {
      const preguntas = preguntasPorPilar[prePilId];
      let totalPosiblePorPilar = 0;
      totalPosiblePreguntasCerradas = 0;
      totalPosiblePreguntasAbiertas = 0;
      totalPosiblePreguntasMultiple = 0;
      console.log('Preguntas');
      console.log(preguntas);
      preguntas.forEach((pregunta) => {
        if (pregunta.preTipId == 3) {
          console.log('Pregunta abierta');

          totalPosiblePreguntasAbiertas++;
        } else if (pregunta.preTipId == 4) {
          console.log('----------Preguntas de seleccion unicas----');
          pregunta.contestaciones.forEach((contestacion) => {
            const valorRespuestaActual = pregunta.respuesta
              .filter((respuesta) => {
                return (
                  respuesta.resPreId == contestacion.corPreId &&
                  contestacion.corResId == respuesta.resId
                );
              })
              .reduce((sum, respuesta) => {
                return sum + respuesta.resValorEvaluacion;
              }, 0);
            console.log('respuestas de selección unica');
            console.log('Pilar ', prePilId);

            console.log(valorRespuestaActual);

            totalPosiblePreguntasCerradas += valorRespuestaActual;
          });
        } else if (pregunta.preTipId == 5) {
          console.log('Preguntas de seleccion multiple');

          const valorRespuestaActual = pregunta.respuesta.reduce(
            (sum, respuesta) => {
              return sum + respuesta.resValorEvaluacion;
            },
            0
          );
          totalPosiblePreguntasMultiple += valorRespuestaActual;
        }
        // console.log("Total posibble pregunta cerrada:::::");
        // console.log(totalPosiblePreguntasCerradas);
        // console.log("Total posible pregunta multiple:::::");
        // console.log(totalPosiblePreguntasMultiple);
        // console.log("Total posible preguntas abiertas");
        // console.log(totalPosiblePreguntasAbiertas);

        totalPosiblePorPilar =
          totalPosiblePreguntasMultiple +
          totalPosiblePreguntasAbiertas +
          totalPosiblePreguntasCerradas;

        
      });

      console.log(
        '----------------------------Total posible por pilar---------------------------------'
      );
      console.log('VALOR FINAL');
      console.log(totalPosiblePorPilar);
      totalPosibleEvaluar += totalPosiblePorPilar; 
      console.log('PILAR ACTUAL');
      console.log(prePilId);
    }
    console.log('Resultado de suma posible: ');
    console.log(totalPosibleEvaluar);

    for (const prePilId in preguntasPorPilar) {
      const preguntas = preguntasPorPilar[prePilId];

      let totalValorEvaluacion = 0;
      let totalPosibleValor = 0;

      preguntas.forEach((pregunta) => {
        if (pregunta.preTipId === 3) {
          // Preguntas abiertas
          const valorPregunta = pregunta.respuesta.some(
            (res) => res.resValor.trim() !== ''
          )
            ? 1
            : 0;

          const valorPreguntaDos = pregunta.contestaciones.some(
            (contestacion) => contestacion.corValor !== ''
          )
            ? 1
            : 0;

          totalValorEvaluacion += valorPreguntaDos;
          totalPosibleValor += 1;
        } else if (pregunta.preTipId === 4) {
          // Preguntas de selección única
          const totalValorPregunta = pregunta.respuesta
            .filter((res) => res.seleccionado)
            .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);

          const totalValorPreguntaDos = pregunta.respuesta
            .filter((res) =>
              pregunta.contestaciones.some(
                (contestacion) => contestacion.corPreId == pregunta.preId
              )
            )
            .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);

          // console.log("VALOR DE LA SUMA DE SELECCION UNICA");
          // console.log(totalValorPreguntaDos);

          const promedioValorPregunta =
            totalValorPregunta /
            pregunta.respuesta.filter((res) => res.seleccionado).length;
          totalValorEvaluacion += isNaN(promedioValorPregunta)
            ? 0
            : promedioValorPregunta;

          // Asumimos que el total posible es la suma de todos los valores de evaluación
          totalPosibleValor += pregunta.respuesta.reduce(
            (sum, res) => sum + res.resValorEvaluacion,
            0
          );
        } else if (pregunta.preTipId === 5) {
          // Preguntas de selección múltiple
          const totalValorPregunta = pregunta.respuesta
            .filter((res) => res.seleccionado)
            .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
          totalValorEvaluacion += totalValorPregunta;

          // Asumimos que el total posible es la suma de todos los valores de evaluación
          totalPosibleValor += pregunta.respuesta.reduce(
            (sum, res) => sum + res.resValorEvaluacion,
            0
          );
        }
      });

      const porcentajePilar = (totalValorEvaluacion / totalPosibleValor) * 100;

      this.valoresPonderadosPorPilar.push({
        prePilId: Number(prePilId),
        valorPonderado: porcentajePilar,
      });
    }

    console.log(this.valoresPonderadosPorPilar);
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
    ////MODIFICAR AQUI
    this.preguntaListService.searchPreguntas(parseInt(this.id, 10)).subscribe({
      next: (response) => {
        ///Asignar valores default a preguntas sin contestaciones
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

        ///Proceso para mostrar las contestaciones
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

        ///Proceso para encontrar preguntas padre
        const preguntasMap = new Map<number, Pregunta[]>();
        this.preguntas.forEach((pregunta) => {
          if (!pregunta.prePreIdTrigger && !pregunta.preResIdTrigger) {
            if (!preguntasMap.has(pregunta.preId)) {
              preguntasMap.set(pregunta.preId, []);
            }
            preguntasMap.get(pregunta.preId)!.push(pregunta);
          }
        });

        // Agregar preguntas hijas al mapeo, las cuales hayan sido disparadas ya
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
        console.log('MAPEO ORDENADO');
        console.log(this.preguntasVisibles);

        this.calcularValoresPonderados();
      },
      error: (error) => {
        console.log('error al ejecutar la respuesta');
        console.log(error);
      },
    });
  }

  volver() {
    // Obtener el ID de la encuesta desde los parámetros de la ruta actual
    const idEncuesta = this.route.snapshot.paramMap.get('id');
    console.log('Enviar');
    console.log(idEncuesta);
    console.log(this.route);

    // Navegar de regreso a /preguntas/:idEncuesta
    this.router.navigate(['/preguntas', idEncuesta]);
  }
}
