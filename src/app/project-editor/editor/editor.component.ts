import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ElementRef } from '@angular/core';

enum DisplayType {
	Asset, Collection
}

// For referncing things like collections and assets
interface SelectableObjectRef {
	type: DisplayType;
	index: number;
}

interface SelectableNode {
	name: string;
	ref: SelectableObjectRef;
	children?: SelectableNode[];
}

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
	treeControl = new NestedTreeControl<SelectableNode>(node => node.children);
	dataSource = new MatTreeNestedDataSource<SelectableNode>();
	selectedElement: SelectableObjectRef;

	constructor(
		private route: ActivatedRoute,
		private projectService: ProjectService,
		private dialog: MatDialog,
	) {
		this.dataSource.data = [];
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
					image.onload = this.drawAll.bind(this);
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

	@ViewChild('myCanvas')
	myCanvas: ElementRef<HTMLCanvasElement>;
	context: CanvasRenderingContext2D;
	//drag variables
	drag = false;

	currentDragAsset: DrawableAsset;

	mdEvent(e) {

		var x = e.offsetX;
		var y = e.offsetY;
		for (var i = this.drawableAssets.length - 1; i >= 0; i--) {
			var asset = this.drawableAssets[i];
			let box = this.getBoundingBox(asset)
			if (x >= box.x_min && x <= box.x_max && y >= box.y_min && y <= box.y_max) {
				this.drag = true;
				this.currentDragAsset = asset;
				break;
			}
		}
	}

	mmEvent(e) {


		if (this.drag) {
			let currentDragAsset = this.currentDragAsset;
			currentDragAsset.asset.position.x += e.movementX;
			currentDragAsset.asset.position.y += e.movementY;

			this.drawAll()

		}

	}
	muEvent(e) {
		this.drag = false;

		this.drag = false;
	}


	//draws all assets uploaded.
	private drawAll() {
		if (!this.context || !this.project) {
			return;
		}
		this.context.clearRect(0, 0, this.myCanvas.nativeElement.width, this.myCanvas.nativeElement.height);
		this.context.scale(.5,.5);
		for (const asset of this.drawableAssets) {
			this.drawAsset(asset)
		}
		this.context.scale(2,2);
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
			context.drawImage(drawable.image, drawable.asset.position.x*2, drawable.asset.position.y*2);
			this.drawBoundingBox(drawable);
		}
	}
	private getBoundingBox(drawable: DrawableAsset) {
		let x_max: number = drawable.asset.position.x + drawable.image.width*.5;
		let y_max: number = drawable.asset.position.y + drawable.image.height*.5;
		let x_min: number = drawable.asset.position.x
		let y_min: number = drawable.asset.position.y

		return {
			x_max, x_min, y_max, y_min
		}
	}
	private drawBoundingBox(drawable: DrawableAsset) {
		let { x_min, x_max, y_min, y_max } = this.getBoundingBox(drawable);
		this.myCanvas.nativeElement.getContext("2d").strokeStyle = "#FF0000"
		this.myCanvas.nativeElement.getContext("2d").strokeRect(x_min*2, y_min*2, (x_max - x_min)*2, (y_max - y_min)*2);
	}
	
	ngAfterViewInit(): void {
		let canvas = (this.myCanvas.nativeElement as HTMLCanvasElement);
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;
		this.context = canvas.getContext('2d');
		this.drawAll();
	}

	refreshAssets(): void {
		let assets: SelectableNode[] = [];

		this.project.assets.forEach((asset, index: number) => {
			// Only list assets which arne't in a collection here
			if (asset.assetCollection === undefined) {
				assets.push({
					name: asset.name,
					ref: {
						type: DisplayType.Asset,
						index,
					},
				});
			}
		});

		this.project.assetCollections.forEach((collection, index: number) => {
			let collectionNode: SelectableNode = {
				name: collection.name,
				ref: {
					type: DisplayType.Collection,
					index,
				},
				children: [],
			};

			collection.assets.forEach((assetIndex: number) => {
				let asset = this.project.assets[assetIndex];
				collectionNode.children.push({
					name: asset.name,
					ref: {
						type: DisplayType.Asset,
						index: assetIndex,
					},
				});
			});

			assets.push(collectionNode);
		});

		this.dataSource.data = assets;
	}

	getDisplayIcon(type: DisplayType): string {
		switch (type) {
			case DisplayType.Asset:
				return 'image'
			case DisplayType.Collection:
				return 'collections'
		}
	}

	hasChild = (_: number, node: SelectableNode) => !!node.children && node.children.length > 0;

	select(item: { type: DisplayType, index: number }): void {
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
