import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FlexAlignStyleBuilder } from '@angular/flex-layout';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';

interface DrawableAsset {
	asset: any;
	assetIndex: number;
	image: HTMLImageElement;
}

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

	projectId: string;
	project: any;
	drawableAssets: DrawableAsset[];

	constructor(
		private route: ActivatedRoute,
		private projectService: ProjectService
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.projectId = window.decodeURIComponent(params['id']);

			this.refreshProject();
		});
	}

	onFileDrop(event: Array<File>) {
		this.projectService.createNewAssets(this.projectId, event).subscribe(
			uploadUrls => {
				console.log(uploadUrls);

				uploadUrls.forEach((url, index) => {
					console.log("Uploading " + event[index].name + " to " + url);
					this.projectService.uploadAsset(url, event[index]).subscribe(
						(res) => {
							console.log("Everything's fine?");
							console.log(res);
						},
						err => console.error(err),
						() => { }
					)

					this.refreshProject();
				})
			},
			err => console.error(err),
			() => { }
		)
	}

	refreshProject(): void {
		this.projectService.getProject(this.projectId).subscribe(
			project => {
				this.project = project;
				console.log(this.project);
				this.drawableAssets = this.project.assets.map((asset, assetIndex) => {
					let image = new Image();
					image.src = asset.url;
					return { asset, assetIndex, image, }
				}
				)
				this.drawAll()

			},
			err => {
				console.error(err);
			},
			() => { }
		);
	}


	@ViewChild('myCanvas', { static: false })

	myCanvas: ElementRef<HTMLCanvasElement>;
	context: CanvasRenderingContext2D;
	//drag variables
	drag = false;
	startX: number = null;
	startY: number = null;
	inside = false;

	//need function isInside(point) to return true when ever the mouse clicks on a point an image exists in.
	//


	// used to calc canvas position relative to window
	private reOffset() {
		var BB = this.myCanvas.nativeElement.getBoundingClientRect();
		var offsetX = BB.left;
		var offsetY = BB.top;
	}
	// save relevant information about shapes drawn on the canvas ???
	shapes = [];
	//hold index of shape being dragged. ???
	selectedShapeIndex;

	mdEvent(e) {
		//persist starting position
		this.startX = e.clientX;
		this.startY = e.clientY;
		this.drag = true;

		/*
		var x = e.pageX - e.target.offsetLeft;
		var y = e.pageY - e.target.offsetTop;
		for(var i = this.projects.assets.length-1; i >= 0; i--) {
		   var asset = this.projects.assets[i];
		   if (this.isInside({x:x,y:y})) {
			  this.drag = true;
			  lastPoint.x = x;
			  lastPoint.y = y;
			  currentDragAsset = asset;
		   }
		}*/
	}

	mmEvent(e) {
		if (this.drag) {
			//redraw image
			let base_image = new Image();
			base_image.src = 'https://ak3.picdn.net/shutterstock/videos/10826363/thumb/1.jpg';
			let sx = this.startX;
			let sy = this.startY;

			let canvasTop = this.myCanvas.nativeElement.getBoundingClientRect().top;
			let canvasLeft = this.myCanvas.nativeElement.getBoundingClientRect().left;
			let context: CanvasRenderingContext2D = this.myCanvas.nativeElement.getContext("2d");

			base_image.onload = function () {
				context.canvas.height = base_image.height;
				context.canvas.width = base_image.width;

				//draw rectangle on canvas
				let x = sx - canvasLeft;
				let y = sy - canvasTop;
				let w = e.clientX - canvasLeft - x;
				let h = e.clientY - canvasTop - y;
				context.setLineDash([6]);
				context.strokeRect(x, y, w, h);
			}
		}
		/*
		 if(this.drag){
			var x = e.pageX - e.target.offsetLeft;
			var y = e.pageY - e.target.offsetTop;
			var deltaX = x - lastPoint.x;
					var deltaY = y - lastPoint.y;
					currentDragObject.position.x += deltaX;
					currentDragObject.position.y += deltaY;
					lastPoint.x = x;
					lastPoint.y = y;
			this.drawAsset()

		 }
		*/
	}
	muEvent(e) {
		//draw final rectangle on canvas
		let x = this.startX - this.myCanvas.nativeElement.getBoundingClientRect().left;
		let y = this.startY - this.myCanvas.nativeElement.getBoundingClientRect().top;
		let w = e.clientX - this.myCanvas.nativeElement.getBoundingClientRect().left - x;
		let h = e.clientY - this.myCanvas.nativeElement.getBoundingClientRect().top - y;
		this.myCanvas.nativeElement.getContext("2d").setLineDash([6]);
		this.myCanvas.nativeElement.getContext("2d").strokeRect(x, y, w, h);

		this.drag = false;
		/*
			this.drag = false;
					lastPoint.x = -1;
					lastPoint.y = -1;
		
		*/

	}


	//draws all assets uploaded.
	private drawAll() {
		//set scale for canvas images to half thier size
		this.context.scale(.5, .5);

		this.context.clearRect(0, 0, this.myCanvas.nativeElement.width, this.myCanvas.nativeElement.height);
		for (const asset of this.drawableAssets) {
			this.drawAsset(asset)
		}
	}
	//loads an image and draws it on the canvas
	private drawAsset(drawable: DrawableAsset) {
		//impliment x and y positions in middle of img
		if (drawable.asset.position === undefined) {
			drawable.asset.position = {
				x: 0,
				y: 0,
			};
		}

		let context = this.context;
		if (drawable.image.complete) {
			context.drawImage(drawable.image, 0, 0);
			this.drawBoundingBox(drawable);
		}
	}
	private getBoundingBox(drawable: DrawableAsset) {
		let x_max: number = drawable.asset.position.x + drawable.image.width;
		let y_max: number = drawable.asset.position.y + drawable.image.height;
		let x_min: number = drawable.asset.position.x
		let y_min: number = drawable.asset.position.y

		return {
			x_max, x_min, y_max, y_min
		}
	}

	private drawBoundingBox(drawable: DrawableAsset) {
		let { x_min, x_max, y_min, y_max } = this.getBoundingBox(drawable);
		this.myCanvas.nativeElement.getContext("2d").strokeStyle = "#FF0000"
		this.myCanvas.nativeElement.getContext("2d").strokeRect(x_min, y_min, x_max - x_min, y_max - y_min);
	}

	//private dragAsset(assets){}
	ngAfterViewInit(): void {
		this.context = (this.myCanvas.nativeElement as HTMLCanvasElement).getContext('2d');
	}

}



