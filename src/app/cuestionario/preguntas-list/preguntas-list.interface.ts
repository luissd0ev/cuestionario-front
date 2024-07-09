export interface Respuesta {
  resId: number;
  resPreId: number;
  resValor: string;
  resValorEvaluacion: number;
}

export interface Pregunta {
  preId: number;
  prePregunta: string;
  preTipId: number;
  prePreIdTrigger: number;
  preResIdTrigger: number;
  respuesta: Respuesta[];
}