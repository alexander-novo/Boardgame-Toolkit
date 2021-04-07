import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorComponent } from './editor/editor.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';

@NgModule({
	declarations: [EditorComponent],
	imports: [
		CommonModule,
		AngularMaterialModule,
		DirectivesModule,
	]
})
export class ProjectEditorModule { }
