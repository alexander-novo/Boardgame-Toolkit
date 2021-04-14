import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Inject } from '@angular/core';

enum DisplayType{
	Asset, Collection
}

interface AssetNode{
	name: string;
	children?: AssetNode[];
	type?: DisplayType;
	index?: number;
}

const TREE_DATA: AssetNode[] = [
	{
		name: 'Assets',
		children: [
			{name: 'list of assets'},
		]
	},
];

export interface CollectionDialogData {
	newCollection: {
		name: string,
		assets: Array<number>,
	};
	assets: Array<{ asset: any, index: number }>;
}

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
	treeControl = new NestedTreeControl<AssetNode>(node => node.children);
	dataSource = new MatTreeNestedDataSource<AssetNode>();
	selectedElement: {type: DisplayType, index: number};

	constructor(
		private route: ActivatedRoute,
		private projectService: ProjectService,
		private dialog: MatDialog,
	) { 
		this.dataSource.data = TREE_DATA;
	}

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
				});

				this.refreshProject();
			},
			err => console.error(err),
			() => { }
		)
	}

	refreshProject(): void {
		this.projectService.getProject(this.projectId).subscribe(
			project => {
				this.project = project;
				this.refreshAssets();
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
	refreshAssets(): void {
		let Assets = {
			name: 'Assets',
			children: []
		};
		this.project.assets.forEach((asset, index)=>{
			if(asset.assetCollection === undefined){
				Assets.children.push({
					name: asset.name,
					type: DisplayType.Asset,
					index,
				})
			}
		}); 
		this.project.assetCollections.forEach((collection, index)=>{
			let CollectionNode = {
				name: collection.name,
				type: DisplayType.Collection,
				index,
				children: []
			};
			collection.assets.forEach(assetIndex=>{
				let asset = this.project.assets[assetIndex];
				CollectionNode.children.push({
					name: asset.name,
					type: DisplayType.Asset,
					index: assetIndex,
				})
			})
			Assets.children.push(CollectionNode);
		});
		this.dataSource.data = [Assets];
		console.log(this.dataSource.data)
	}

	getDisplayIcon(type: DisplayType): string {
		switch (type){
			case DisplayType.Asset:
				return 'image'
			case DisplayType.Collection:
				return 'collections'
		}
	}

	hasChild = (_: number, node: AssetNode) => !!node.children && node.children.length > 0;

	select(item: {type: DisplayType, index: number}): void {
		console.log("changed selected item to")
		console.log(item)
		this.selectedElement = item
	}

	newCollection(): void {
		let newCollectionName: string = '';
		const dialogRef = this.dialog.open(CollectionDialogComponent, {
			width: '400px',
			data: {
				newCollection: {
					name: newCollectionName,
					assets: [],
				},
				assets: this.project.assets.filter(asset => asset.assetCollection === undefined).map((asset, index) => { return { asset, index } }),
			}
		});

		let project = this.project;
		let projectService = this.projectService;
		dialogRef.afterClosed().subscribe(newCollection => {
			if (newCollection !== undefined) {
				project.assetCollections.push(newCollection);
				for (let index of newCollection.assets) {
					project.assets[index].assetCollection = project.assetCollections.length - 1;
				}

				this.refreshAssets();
				projectService.saveProject(this.projectId, project).subscribe(
					() => { },
					err => {
						console.error(err);
					},
					() => { }
				);
			}
		});
	}

}

@Component({
	selector: 'collection-dialog',
	templateUrl: 'collection-dialog.component.html',
})
export class CollectionDialogComponent {
	@ViewChild('collectionList') collectionList: MatSelectionList;

	constructor(
		public dialogRef: MatDialogRef<CollectionDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: CollectionDialogData) { }

	onNoClick(): void {
		this.dialogRef.close();
	}

	onOkClick(): void {
		this.dialogRef.close({ name: this.data.newCollection.name, assets: this.collectionList.selectedOptions.selected.map(option => option.value) })
	}

}
