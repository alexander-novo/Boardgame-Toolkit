import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorComponent } from './editor/editor.component';
//import { CanvasComponent } from './editor/canvas.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';
import { DragDropModule } from '@angular/cdk/drag-drop';



@NgModule({
	declarations: [EditorComponent],
	imports: [
		CommonModule,
		AngularMaterialModule,
		DirectivesModule,
		DragDropModule,
	]
})
export class ProjectEditorModule { }
