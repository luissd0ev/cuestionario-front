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

  searchPreguntas(): Observable<Pregunta[]>{
    const apiUrl = `${this.url}/Allquestionss`;
    return this.http.get<Pregunta[]>(apiUrl, {headers: headers}); 
  } 

}