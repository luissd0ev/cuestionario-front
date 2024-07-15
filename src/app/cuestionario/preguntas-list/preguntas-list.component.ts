import { Component, OnInit } from '@angular/core';
import { PreguntaListService } from './preguntas-list.service';
import { Pregunta, Respuesta } from './preguntas-list.interface';

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

  constructor(private preguntaListService: PreguntaListService) {}

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

  saveStateToLocalStorage() {
    const state = {
      preguntas: this.preguntas,
      preguntasVisibles: this.preguntasVisibles,
      valoresPonderadosPorPilar: this.valoresPonderadosPorPilar,
      pilarActualIndex: this.pilarActualIndex,
    };
    localStorage.setItem('preguntasState', JSON.stringify(state));
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

  desactivarPreguntasHijas(pregunta: Pregunta): void {
    this.preguntasVisibles = this.preguntasVisibles.filter(
      (p) => p.prePreIdTrigger !== pregunta.preId
    );
  }

  irAPilarAnterior(): void {
    if (this.pilarActualIndex > 0) {
      this.pilarActualIndex--;
      this.saveStateToLocalStorage();
    }
  }

  irAPilarSiguiente(): void {
    if (this.pilarActualIndex < this.valoresPonderadosPorPilar.length - 1) {
      this.pilarActualIndex++;
      this.saveStateToLocalStorage();
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

    const index = this.preguntasVisibles.indexOf(pregunta) + 1;

    for (const nuevaPregunta of nuevasPreguntas) {
      if (!this.preguntasVisibles.includes(nuevaPregunta)) {
        this.preguntasVisibles.splice(index, 0, nuevaPregunta);
      }
    }

    pregunta.respuesta.forEach((res) => (res.seleccionado = res === respuesta));
    // Actualiza las contestaciones según las respuestas seleccionadas
    pregunta.contestaciones = pregunta.contestaciones.filter(
      (cont) => cont.corPreId !== pregunta.preId
    );
    pregunta.contestaciones.push({
      corId: 0, // Asigna un ID si es necesario
      corResId: respuesta.resId,
      corPreId: pregunta.preId,
      corValor: respuesta.resValor,
      corImagen: '', // Asigna una imagen si es necesario
      corNoContesto: false,
    });
    this.preguntas.map((pregunta)=>{
      return {
        ...pregunta, 
        contestaciones: [
          ...pregunta.contestaciones,
          {
            corId: 0, // Asigna un ID si es necesario
            corResId: respuesta.resId,
            corPreId: pregunta.preId,
            corValor: respuesta.resValor,
            corImagen: '', // Asigna una imagen si es necesario
            corNoContesto: false,
          }
        ]
      }
    })
    console.log("VALOR DE CONTESTACIONES "); 
    console.log(pregunta.contestaciones);

    console.log("Valor de preguntas:");
    console.log(this.preguntas); 
    
    
    
    this.calcularValoresPonderados();
  }

  onRespuestaTextoCambiado(pregunta: Pregunta, event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    // pregunta.respuesta[0].resValor = inputElement.value; 
    pregunta.contestaciones[0] =  {
      corId: 0, 
      corResId: 1,
      corPreId: pregunta.preId,
      corValor: inputElement.value,
      corImagen: '', 
      corNoContesto: false,
    }; 
    console.log("WRITTING"); 
    // this.preguntas.map((pregunta)=>{
    //   return {
    //     ...pregunta, 
    //     contestaciones: [
    //       ...pregunta.contestaciones,
    //       {
    //         corId: 0, 
    //         corResId: 1,
    //         corPreId: pregunta.preId,
    //         corValor: inputElement.value,
    //         corImagen: '', 
    //         corNoContesto: false,
    //       }
    //     ]
    //   }
    // })
    console.log("Valor de preguntas:");
    console.log(this.preguntas); 
    
    this.calcularValoresPonderados(); // Recalcula los valores ponderados si es necesario
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

        this.preguntasVisibles = this.preguntas
          .sort((a, b) => a.prePilId - b.prePilId)
          .filter((p) => !p.prePreIdTrigger);
        console.log('DATOS RECIBIDOS y ya ordenados.');
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
