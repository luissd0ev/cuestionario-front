import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pregunta } from './preguntas-list.interface';
// import { ArticuloBusqueda } from '../tienda-online';

const headers = new HttpHeaders().set('Accept', 'application/json');

@Injectable()
export class PreguntaListService {
  private url: string = 'https://localhost:7190/api/Preguntas';

  constructor(private http: HttpClient) {}

  searchPreguntas(id: number): Observable<Pregunta[]>{
    const apiUrl = `${this.url}/Allquestions?conId=${id}`;
    return this.http.get<Pregunta[]>(apiUrl, {headers: headers}); 
  } 
  
  saveUpdateQuestions(request: Pregunta[], idContestacion: number): Observable<any>{
    const apiUrl = `${this.url}/guardar-contestaciones-respuestas?corConId=${idContestacion}`;
    return this.http.post<Pregunta[]>(apiUrl, request, {headers: headers}); 
  }
}