import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EncodeURIComponentPipe } from './encode-uri-component.pipe';



@NgModule({
	declarations: [
		EncodeURIComponentPipe,
	],
	imports: [
		CommonModule
	],
	exports: [
		EncodeURIComponentPipe,
	]
})
export class PipesModule { }
