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
    let totalEvaluado = 0; 
    let totalEvaluadoPilar = 0; 
    let calculoPorcentajePonderado = 0; 
    for (const prePilId in preguntasPorPilar) {
        const preguntas = preguntasPorPilar[prePilId];
        let totalPosiblePreguntasAbiertas = 0;
        let totalPosiblePreguntasMultiple = 0;
        let totalPosiblePreguntasCerradas = 0;
        totalEvaluadoPilar = 0; 
        console.log('Preguntas');
        console.log(preguntas);
  
        preguntas.forEach((pregunta) => {
            if (pregunta.preTipId == 3) {
                console.log('Pregunta abierta');
                if(pregunta.contestaciones){
                  const valorPreguntaAbierta = pregunta.contestaciones.some(
                    (contestacion) => contestacion.corValor !== ''
                  )
                    ? 1
                    : 0;
                    totalEvaluado += valorPreguntaAbierta; 
                    totalEvaluadoPilar += valorPreguntaAbierta; 
                }
               
                totalPosiblePreguntasAbiertas++;
            } else if (pregunta.preTipId == 4) {
                console.log('----------Preguntas de seleccion unicas----');
                pregunta.contestaciones.forEach((contestacion) => {
                    const valorRespuestaActual = pregunta.respuesta
                        .filter((respuesta) => (
                            respuesta.resPreId == contestacion.corPreId &&
                            contestacion.corResId == respuesta.resId
                        ))
                        .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
                pregunta.respuesta.forEach((respuesta)=>{
                  return respuesta.resValor
                })

                const valorMaximo = pregunta.respuesta.reduce((max, respuesta) => {
                  return respuesta.resValorEvaluacion > max ? respuesta.resValorEvaluacion : max;
                }, 0);
                console.log("VALOR MAXIMO DE GRUPO DE PREGUNTAS::::::------------>>>>>>>>>");
                console.log(valorMaximo);
                
                
                    console.log('respuestas de selección unica');
                    console.log('Pilar ', prePilId);
                    console.log(valorRespuestaActual);
                    totalPosiblePreguntasCerradas += valorMaximo;
                    totalEvaluado += valorRespuestaActual; 
                    totalEvaluadoPilar += valorRespuestaActual; 
                });
            } else if (pregunta.preTipId == 5) {
                console.log('Preguntas de seleccion multiple');
                const valorRespuestaActual = pregunta.respuesta.reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
                pregunta.contestaciones.forEach((contestacion)=>{
                  const valorRespuesta = pregunta.respuesta
                  .filter((respuesta) => (
                      respuesta.resPreId == contestacion.corPreId &&
                      contestacion.corResId == respuesta.resId
                  ))  
                  .reduce((sum, respuesta) => sum + respuesta.resValorEvaluacion, 0);
                  console.log("VALOR EVALUADO SELECCION MULTIPLE-----------------------");
                  console.log(valorRespuesta);
                  
                  totalEvaluado += valorRespuesta; 
                  totalEvaluadoPilar += valorRespuesta; 
                });
                
                totalPosiblePreguntasMultiple += valorRespuestaActual;
            }
        });
    
        const totalPosiblePorPilar = totalPosiblePreguntasMultiple + totalPosiblePreguntasAbiertas + totalPosiblePreguntasCerradas;
        
        console.log('----------------------------Total posible por pilar---------------------------------');
        console.log('VALOR FINAL');
        console.log(totalPosiblePorPilar);
        
        totalPosibleEvaluar += totalPosiblePorPilar; 
        this.valoresPonderadosPorPilar.push({
          prePilId: Number(prePilId),
          valorPonderado: (totalEvaluadoPilar*100)/totalPosiblePorPilar,
        });
        console.log('PILAR ACTUAL');
        console.log(prePilId);
    }
    
    console.log('Resultado de suma posible: ');
    console.log(totalPosibleEvaluar);
    console.log("Resultado total evaluado: ");
    console.log(totalEvaluado);

    console.log("Calculo de porcentaje ponderado: ");
    calculoPorcentajePonderado = (100*totalEvaluado)/totalPosibleEvaluar;
    console.log(calculoPorcentajePonderado);
    
    
    



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
