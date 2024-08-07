import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import {FormsModule} from "@angular/forms"; 
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTableModule } from "@angular/material/table";
import { HttpClient } from "@angular/common/http";
import { MatFormFieldModule } from "@angular/material/form-field";
import { ToastrModule, ToastrService } from "ngx-toastr";
import { MatInputModule } from "@angular/material/input";
import { PreguntasListComponent } from "./preguntas-list/preguntas-list.component";
import { CuestionarioRoutingModule } from "./cuestionario.routing.module";
import { PreguntaListService } from "./preguntas-list/preguntas-list.service";
import { ResultComponent } from "./results/result.component";

///Agregar componentes genericos para usar materials
@NgModule(
    {
        imports: [
            CommonModule,
            FormsModule,
            MatTableModule,
            MatButtonModule,
            MatIconModule,
            MatDialogModule,
            MatFormFieldModule,
            ToastrModule.forRoot({
                preventDuplicates: true
            }),
            MatInputModule,
            CuestionarioRoutingModule,
            
        ],
        ///Componentes que forman parte del modulo.
        declarations: [PreguntasListComponent, ResultComponent],
        ///servicios que puedo usar en los componentes
        providers: [PreguntaListService,ToastrService],
        ///Quiero que el componente pueda ser usado en otros components
        exports: [PreguntasListComponent, ResultComponent]
    }
)

export class TiendaOnlineModule{

}