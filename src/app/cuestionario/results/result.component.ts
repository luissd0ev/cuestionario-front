import { Component, OnInit } from '@angular/core';
import { Pregunta } from '../preguntas-list/preguntas-list.interface';

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

  ngOnInit(): void {
    this.loadStateFromLocalStorage();
  }

  loadStateFromLocalStorage() {
    const savedState = localStorage.getItem('preguntasState');
    console.log("DATOS DEL LOCALSTORAGE:");
    console.log(savedState); 
   
    if (savedState) {
      const state = JSON.parse(savedState);
      console.log("STATE:");
      console.log(state); 
      this.preguntas = state.preguntas || [];
      this.preguntasVisibles = state.preguntasVisibles || [];
      this.valoresPonderadosPorPilar = state.valoresPonderadosPorPilar || [];
      this.pilarActualIndex = state.pilarActualIndex || 0;
    }
  }
}