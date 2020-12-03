import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const routes: Routes = [];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule]
})
export class AppRoutingModule { }
