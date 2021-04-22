import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { MaterialFileInputModule } from 'ngx-material-file-input';

import { EditorComponent } from './editor/editor.component';
import { CollectionDialogComponent } from './editor/collection-dialog.component';
import { AssetUploadDialogComponent } from './editor/asset-upload-dialog.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';

@NgModule({
	declarations: [EditorComponent, CollectionDialogComponent, AssetUploadDialogComponent],
	imports: [
		CommonModule,
		AngularMaterialModule,
		DirectivesModule,
		FormsModule,
		MaterialFileInputModule,
		ReactiveFormsModule,
		NgxDropzoneModule,
	]
})
export class ProjectEditorModule { }
