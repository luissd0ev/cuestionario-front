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
  contestaciones: Contestacion[]; 
}

export interface Contestacion {
  corId: number;        // ID de la contestación
  corResId: number;     // ID de la respuesta seleccionada
  corPreId: number;     // ID de la pregunta
  corValor: string;     // Valor de la contestación (puede ser texto)
  corImagen: string;    // Imagen codificada en base64 (si aplica)
  corNoContesto: boolean; // Indica si la pregunta no fue contestada
}