import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'preguntas/:id',
        loadChildren: () =>
          import('./cuestionario/cuestionario.module').then(
            (m) => m.TiendaOnlineModule
          ),
      },
      
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule { }