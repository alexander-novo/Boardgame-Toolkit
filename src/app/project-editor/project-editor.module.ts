import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { MatChipsModule } from '@angular/material/chips';
import { DragDropModule} from '@angular/cdk/drag-drop';


import { CollectionDialogComponent,TagDialogComponent, EditorComponent } from './editor/editor.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';
import { MaterialFileInputModule } from 'ngx-material-file-input';


@NgModule({
	declarations: [EditorComponent, CollectionDialogComponent, TagDialogComponent],
	imports: [
		CommonModule,
		MatChipsModule,
		DragDropModule,
		AngularMaterialModule,
		DirectivesModule,
		FormsModule,
		MaterialFileInputModule,
		ReactiveFormsModule,
		NgxMatColorPickerModule,
	],
	providers:[{
		provide: MAT_COLOR_FORMATS,
		useValue: NGX_MAT_COLOR_FORMATS
		},
	],
})
export class ProjectEditorModule { }
