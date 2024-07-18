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

  constructor(
    private preguntaListService: PreguntaListService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
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
    this.preguntaListService.searchPreguntas(1).subscribe({
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
        console.log('PREGUNTAS MAP DESPUES DE ASIGNAR HIJAS A PADRE');
        console.log(preguntasMap);

        // Convertir el mapeo en un array ordenado de preguntas visibles
        this.preguntasVisibles = [];
        preguntasMap.forEach((preguntas) => {
          this.preguntasVisibles.push(...preguntas);
        });
        console.log("MAPEO ORDENADO");
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
  console.log("Enviar");
  console.log(idEncuesta);
  console.log(this.route);
  
  
    // Navegar de regreso a /preguntas/:idEncuesta
    this.router.navigate(['/preguntas', idEncuesta]);
  }

}
