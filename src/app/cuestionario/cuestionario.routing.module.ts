import { RouterModule } from "@angular/router";
import { NgModule } from "@angular/core";
import { PreguntasListComponent } from "./preguntas-list/preguntas-list.component";
import { ResultComponent } from "./results/result.component";


export const TIPO_DISPOSITIVO_ROUTES = [
    //SI NO LE PASO NADA, muestra lista
        {
            path: '',
            component: PreguntasListComponent
        },
        ///PASAR ARGUMENTO ID, paso componente
        {
            path: 'result',
            component: ResultComponent
        }
    ];
    
    @NgModule({
        imports: [RouterModule.forChild(TIPO_DISPOSITIVO_ROUTES)],
        exports: [RouterModule]
    })
    
    export class CuestionarioRoutingModule{
        
    }