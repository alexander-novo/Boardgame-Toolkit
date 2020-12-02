import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

const routes: Routes = [];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule, MatCardModule, MatButtonModule]
})
export class AppRoutingModule { }
