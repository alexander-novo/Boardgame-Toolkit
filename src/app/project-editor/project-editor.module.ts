import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CollectionDialogComponent, EditorComponent } from './editor/editor.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';

@NgModule({
	declarations: [EditorComponent, CollectionDialogComponent],
	imports: [
		CommonModule,
		AngularMaterialModule,
		DirectivesModule,
		FormsModule,
	]
})
export class ProjectEditorModule { }
