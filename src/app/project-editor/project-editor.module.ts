import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgxDropzoneModule } from 'ngx-dropzone';
import { MaterialFileInputModule } from 'ngx-material-file-input';
import { ColorPickerModule } from 'ngx-color-picker';

import { EditorComponent } from './editor/editor.component';
import { CollectionDialogComponent } from './editor/collection-dialog.component';
import { AssetUploadDialogComponent } from './editor/asset-upload-dialog.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';
import { WorkspaceComponent } from './workspace/workspace.component';

@NgModule({
	declarations: [EditorComponent, CollectionDialogComponent, AssetUploadDialogComponent, WorkspaceComponent],
	imports: [
		CommonModule,
		AngularMaterialModule,
		DirectivesModule,
		FormsModule,
		MaterialFileInputModule,
		ReactiveFormsModule,
		NgxDropzoneModule,
		ColorPickerModule,
	]
})
export class ProjectEditorModule { }
