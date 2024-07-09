export interface Respuesta {
  resId: number;
  resPreId: number;
  resValor: string;
  seleccionado?: boolean; 
  resValorEvaluacion: number;
}

export interface Pregunta {
  preId: number;
  prePregunta: string;
  preTipId: number;
  prePreIdTrigger: number;
  preResIdTrigger: number;
  prePilId: number; 
  respuesta: Respuesta[];
}