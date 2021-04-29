import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { MatChipsModule } from '@angular/material/chips';
import { DragDropModule } from '@angular/cdk/drag-drop';


import { NgxDropzoneModule } from 'ngx-dropzone';
import { MaterialFileInputModule } from 'ngx-material-file-input';
import { ColorPickerModule } from 'ngx-color-picker';

import { TagDialogComponent, EditorComponent } from './editor/editor.component';
import { CollectionDialogComponent } from './editor/collection-dialog.component';
import { AssetUploadDialogComponent } from './editor/asset-upload-dialog.component';
import { AngularMaterialModule } from '../angular-material.module';
import { DirectivesModule } from '../directives/directives.module';
import { WorkspaceComponent } from './workspace/workspace.component';
import { RegionEditorComponent } from './region-editor/region-editor.component';
import { MonacoEditorModule } from '@sentinel-one/ngx-monaco-editor';


@NgModule({
	declarations: [EditorComponent, CollectionDialogComponent, AssetUploadDialogComponent, WorkspaceComponent, RegionEditorComponent, TagDialogComponent],
	imports: [
		CommonModule,
		MatChipsModule,
		DragDropModule,
		AngularMaterialModule,
		DirectivesModule,
		FormsModule,
		MaterialFileInputModule,
		ReactiveFormsModule,
		NgxDropzoneModule,
		ColorPickerModule,
		NgxMatColorPickerModule,
		MonacoEditorModule,
	]
})
export class ProjectEditorModule { }
