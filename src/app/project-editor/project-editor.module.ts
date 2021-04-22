import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CollectionDialogComponent,TagDialogComponent, EditorComponent } from './editor/editor.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';
import { MaterialFileInputModule } from 'ngx-material-file-input';

@NgModule({
	declarations: [EditorComponent, CollectionDialogComponent, TagDialogComponent],
	imports: [
		CommonModule,
		AngularMaterialModule,
		DirectivesModule,
		FormsModule,
		MaterialFileInputModule,
		ReactiveFormsModule,
	]
})
export class ProjectEditorModule { }
