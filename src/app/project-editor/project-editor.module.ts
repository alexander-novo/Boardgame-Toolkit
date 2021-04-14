import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CollectionDialogComponent, EditorComponent } from './editor/editor.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';
import { FormsModule } from '@angular/forms';

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
