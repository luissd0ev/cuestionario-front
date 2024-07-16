import { Component, OnInit } from '@angular/core';
import { PreguntaListService } from './preguntas-list.service';
import { Pregunta, Respuesta } from './preguntas-list.interface';
import { ActivatedRoute, Router } from '@angular/router';

interface ValorPonderadoPorPilar {
  prePilId: number;
  valorPonderado: number;
}

@Component({
  selector: 'preguntas-list',
  templateUrl: 'preguntas-list.component.html',
  styleUrls: ['./preguntas-list.component.css'],
})
export class PreguntasListComponent implements OnInit {
  preguntas: Pregunta[] = [];
  preguntasVisibles: Pregunta[] = [];
  valoresPonderadosPorPilar: ValorPonderadoPorPilar[] = [];
  pilarActualIndex: number = 0;

  constructor(
    private preguntaListService: PreguntaListService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStateFromLocalStorage();
    this.searchPreguntas();
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

    this.saveStateToLocalStorage();
    console.log(this.valoresPonderadosPorPilar);
  }

  desactivarPreguntasHijas(pregunta: Pregunta): void {
    this.preguntasVisibles = this.preguntasVisibles.filter(
      (p) => p.prePreIdTrigger !== pregunta.preId
    );
  }

  direccionar() {
    this.guardar(1);
  }

  desactivarPreguntasHijass(pregunta: Pregunta): void {
    const preguntasHijas = this.preguntas.filter(
      (p) => p.prePreIdTrigger === pregunta.preId
    );

    preguntasHijas.forEach((preguntaHija) => {
      // Desactivar recursivamente las preguntas hijas
      this.desactivarPreguntasHijas(preguntaHija);
    });

    this.preguntasVisibles = this.preguntasVisibles.filter(
      (p) => p.prePreIdTrigger !== pregunta.preId
    );
  }
  guardar(tipoGuardado?: number) {
    const preguntasFiltro = this.preguntasVisibles.map((pregunta) => {
      return {
        ...pregunta,
        contestaciones: pregunta.contestaciones.filter((contestacion) => {
          return contestacion.corResId != 0;
        }),
      };
    });
    this.preguntaListService.saveUpdateQuestions(preguntasFiltro).subscribe({
      next: (result) => {
        console.log('Datos guardados con exito.');
        // alert("Datos guardados con éxito.");
        if (tipoGuardado == 1) {
          this.router.navigate(['/preguntas/result']);
        }
      },
      error: (error) => {
        console.log('Error en la operación.');
        // alert("error en la operación.");
      },
    });
  }

  irAPilarAnterior(): void {
    if (this.pilarActualIndex > 0) {
      this.pilarActualIndex--;
      this.guardar();
      this.saveStateToLocalStorage();
      this.searchPreguntas();
    }
  }

  irAPilarSiguiente(): void {
    if (this.pilarActualIndex < this.valoresPonderadosPorPilar.length - 1) {
      this.pilarActualIndex++;
      this.guardar();
      this.saveStateToLocalStorage();
      this.searchPreguntas();
    }
  }

  loadStateFromLocalStorage() {
    const savedState = localStorage.getItem('preguntasState');
    if (savedState) {
      const state = JSON.parse(savedState);
      this.preguntas = state.preguntas || [];
      this.preguntasVisibles = state.preguntasVisibles || [];
      this.valoresPonderadosPorPilar = state.valoresPonderadosPorPilar || [];
      this.pilarActualIndex = state.pilarActualIndex || 0;
    }
  }

  onRespuestaSeleccionada(pregunta: Pregunta, respuesta: Respuesta): void {
    const getCorId = pregunta.contestaciones[0].corId ?? 0;

    // Desactivar las preguntas hijas de la pregunta actual antes de actualizar la respuesta seleccionada
    this.desactivarPreguntasHijass(pregunta);

    // Actualizar las respuestas seleccionadas
    pregunta.respuesta.forEach((res) => (res.seleccionado = res === respuesta));

    // Actualizar las contestaciones según las respuestas seleccionadas
    pregunta.contestaciones = pregunta.contestaciones.filter(
      (cont) => cont.corPreId !== pregunta.preId
    );

    pregunta.contestaciones.push({
      corId: getCorId, // Asigna un ID si es necesario
      corResId: respuesta.resId,
      corPreId: pregunta.preId,
      corValor: respuesta.resValor,
      corImagen: '', // Asigna una imagen si es necesario
      corNoContesto: false,
    });

    // Encontrar preguntas que serán agregadas
    const nuevasPreguntas = this.preguntas.filter(
      (p) =>
        p.prePreIdTrigger === pregunta.preId &&
        p.preResIdTrigger === respuesta.resId
    );

    // Encontrar el índice de la pregunta actual, seleccionada
    const index = this.preguntasVisibles.indexOf(pregunta) + 1;

    // Insertar las nuevas preguntas después del índice de la pregunta actual
    for (const nuevaPregunta of nuevasPreguntas) {
      if (!this.preguntasVisibles.includes(nuevaPregunta)) {
        this.preguntasVisibles.splice(index, 0, nuevaPregunta);
      }
    }

    // Actualizar el array de preguntas
    this.preguntas = this.preguntas.map((pregunta) => {
      return {
        ...pregunta,
        contestaciones: [
          ...pregunta.contestaciones,
          {
            corId: getCorId, // Asigna un ID si es necesario
            corResId: respuesta.resId,
            corPreId: pregunta.preId,
            corValor: respuesta.resValor,
            corImagen: '', // Asigna una imagen si es necesario
            corNoContesto: false,
          },
        ],
      };
    });

    // Recalcular los valores ponderados
    this.calcularValoresPonderados();
  }

  onRespuestaTextoCambiado(pregunta: Pregunta, event: Event): void {
    const inputElement = event.target as HTMLInputElement;

    const getCorId = pregunta.contestaciones[0].corId ?? 0;

    pregunta.contestaciones[0] = {
      corId: getCorId,
      corResId: 1,
      corPreId: pregunta.preId,
      corValor: inputElement.value,
      corImagen: '',
      corNoContesto: false,
    };

    this.calcularValoresPonderados();
  }

  obtenerPreguntasDelPilarActual(): Pregunta[] {
    const pilarActual = this.valoresPonderadosPorPilar[this.pilarActualIndex];
    return this.preguntasVisibles.filter(
      (pregunta) => pregunta.prePilId === pilarActual.prePilId
    );
  }

  saveStateToLocalStorage() {
    const state = {
      preguntas: this.preguntas,
      preguntasVisibles: this.preguntasVisibles,
      valoresPonderadosPorPilar: this.valoresPonderadosPorPilar,
      pilarActualIndex: this.pilarActualIndex,
    };

    localStorage.setItem('preguntasState', JSON.stringify(state));
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

        // Crear el mapeo de preguntas normales
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
}
