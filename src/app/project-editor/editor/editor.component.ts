import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { Asset, AssetCollection, Project, ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ElementRef } from '@angular/core';
import { fabric } from "fabric";

enum DisplayType {
	Asset, Collection
}

export class CollectionDialogData {
	newCollection: {
		name: string,
		assets: Array<number>,
	};
	assets: Array<{ asset: Asset, index: number }>;
}

interface Drawable {
	type: DisplayType;
	id: string;
	ref: Asset | AssetCollection;
	image: fabric.Image;
}

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

	projectId: string;
	project: Project;
	Drawables = new Map<{ type: DisplayType, id: string }, Drawable>();
	treeControl = new NestedTreeControl<Drawable | { type: DisplayType, ref: Asset }>(
		node => {
			return node.type == DisplayType.Collection ?
				(node.ref as AssetCollection).assets.map(assetIndex => ({ type: DisplayType.Asset, ref: this.project.assets[assetIndex] })) :
				[];
		}
	);
	dataSource = new MatTreeNestedDataSource<Drawable | Asset>();
	selectedElement: Drawable;
	@ViewChild('myCanvas')
	myCanvas: ElementRef<HTMLCanvasElement>;
	// context: CanvasRenderingContext2D;
	canvas: fabric.Canvas;
	drag = false;
	dirty = false;
	shouldsave = true;
	currentDragAsset: Drawable;

	hasChild = (_: number, node: Drawable | { type: DisplayType, ref: Asset }) =>
		node.type == DisplayType.Collection &&
		(node.ref as AssetCollection).assets.length > 0;

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
		// Save the project first, then create new assets on the server
		// Upload images to new asset urls, then pull project down from server
		this.projectService.saveProject(this.projectId, this.project).subscribe(
			() => {
				this.projectService.createNewAssets(this.projectId, event).subscribe(
					uploadUrls => {
						console.log(uploadUrls);

						let uploaded = (new Array<boolean>(uploadUrls.length)).fill(false);
						uploadUrls.forEach((url, index) => {
							console.log("Uploading " + event[index].name + " to " + url);
							this.projectService.uploadAsset(url, event[index]).subscribe(
								(res) => {
									uploaded[index] = true;
									if (uploaded.every(flag => flag)) {
										console.log("Successfully uploaded all images. Refreshing project...");
										this.refreshProject();
									}
								},
								err => console.error(err),
								() => { }
							)
						}, this);
					},
					err => console.error(err),
					() => { }
				)
			}
		)
	}

	refreshProject(): void {
		this.projectService.getProject(this.projectId).subscribe(
			project => {
				this.project = project;
				// this.refreshAssets();
				this.addProjectToCanvas();

				console.log(this.project);
			},
			err => {
				console.error(err);
			},
			() => { }
		);
	}

	private getBoundingBox(drawable: Drawable) {
		let x_max: number = drawable.ref.position.x + drawable.image.width * .5;
		let y_max: number = drawable.ref.position.y + drawable.image.height * .5;
		let x_min: number = drawable.ref.position.x
		let y_min: number = drawable.ref.position.y

		return {
			x_max, x_min, y_max, y_min
		}
	}
	private drawBoundingBox(drawable: Drawable) {
		let { x_min, x_max, y_min, y_max } = this.getBoundingBox(drawable);
		this.myCanvas.nativeElement.getContext("2d").strokeStyle = "#00FF00"
		this.myCanvas.nativeElement.getContext("2d").strokeRect(x_min * 2, y_min * 2, (x_max - x_min) * 2, (y_max - y_min) * 2);
	}

	ngAfterViewInit(): void {
		// Make canvas pixel size the same as it actually is on the DOM (css set to 100%)
		let canvas = this.myCanvas.nativeElement;
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;

		fabric.Object.prototype.borderColor = 'LimeGreen';
		fabric.Object.prototype.cornerColor = 'LimeGreen';
		fabric.Object.prototype.borderScaleFactor = 2;
		fabric.Object.prototype.borderDashArray = [5, 5];
		this.canvas = new fabric.Canvas(canvas);

		this.canvas.on('object:selected', (e) => {
			console.log("Selected element!")
			this.selectedElement = Array.from(this.Drawables.values()).find(drawable => drawable.image == e.target);
			console.log(this.selectedElement);
		})

		this.addProjectToCanvas();

		// Auto save every 5 seconds if the project is dirty
		setInterval(() => {
			if (this.dirty && this.shouldsave) {
				this.projectService.saveProject(this.projectId, this.project).subscribe();
				this.project.__v++;
				this.dirty = false;
			}
		}, 5000)
	}

	addProjectToCanvas(): void {
		if (!this.project || !this.canvas) {
			return;
		}

		console.log("Adding assets to canvas...");
		this.canvas.clear();
		this.Drawables = new Map(this.project.assets
			.filter(asset => asset.assetCollection === undefined)
			.map((asset): Drawable => {
				if (asset.position === undefined) {
					asset.position = {
						x: 0,
						y: 0
					}
				}

				let re: Drawable = {
					image: null,
					ref: asset,
					type: DisplayType.Asset,
					id: asset._id,
				};

				fabric.Image.fromURL(asset.url, img => {
					re.image = img;
					img.on('selected', e => {
						console.log("Selected drawable");
						this.selectedElement = re;
						console.log(this.selectedElement);
					});
					this.canvas.add(img);
				}, {
					left: asset.position.x,
					top: asset.position.y,
				});

				return re;
			}).concat(this.project.assetCollections
				.filter(collection => collection.assets.length > 0)
				.map((collection): Drawable => {
					if (collection.position === undefined) {
						collection.position = {
							x: 0,
							y: 0
						}
					}

					let re: Drawable = {
						image: null,
						ref: collection,
						type: DisplayType.Collection,
						id: collection._id,
					};

					fabric.Image.fromURL(this.project.assets[collection.assets[0]].url, img => {
						re.image = img;
						img.on('selected', e => {
							console.log("Selected drawable");
							this.selectedElement = re;
							console.log(this.selectedElement);
						});
						this.canvas.add(img);
					}, {
						left: collection.position.x,
						top: collection.position.y,
					});

					return re;
				})).map(drawable => [
					{
						type: drawable.type,
						id: drawable.id,
					},
					drawable,
				]));

		this.dataSource.data = Array.from(this.Drawables.values());
		console.log("Drawables:");
		console.log(this.Drawables);
		this.canvas.renderAll();
	}

	// refreshAssets(): void {
	// 	let assets: SelectableNode[] = [];

	// 	this.project.assets.forEach((asset, index: number) => {
	// 		// Only list assets which aren't in a collection here
	// 		if (asset.assetCollection === undefined) {
	// 			assets.push({
	// 				name: asset.name,
	// 				ref: {
	// 					type: DisplayType.Asset,
	// 					ref: asset,
	// 				},
	// 			});
	// 		}
	// 	});

	// 	this.project.assetCollections.forEach((collection, index: number) => {
	// 		let collectionNode: SelectableNode = {
	// 			name: collection.name,
	// 			ref: {
	// 				type: DisplayType.Collection,
	// 				ref: collection,
	// 			},
	// 			children: [],
	// 		};

	// 		collection.assets.forEach((assetIndex: number) => {
	// 			let asset = this.project.assets[assetIndex];
	// 			collectionNode.children.push({
	// 				name: asset.name,
	// 				ref: {
	// 					type: DisplayType.Asset,
	// 					ref: asset,
	// 				},
	// 			});
	// 		});

	// 		assets.push(collectionNode);
	// 	});

	// 	this.dataSource.data = assets;
	// }

	getDisplayIcon(type: DisplayType): string {
		switch (type) {
			case DisplayType.Asset:
				return 'image'
			case DisplayType.Collection:
				return 'collections'
		}
	}

	select(item: Drawable | { type: DisplayType, ref: Asset }): void {
		if ("image" in item) {
			this.canvas.setActiveObject(item.image);
			this.canvas.renderAll();
		}
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

				// this.refreshAssets();
				projectService.saveProject(this.projectId, project).subscribe(
					() => { },
					err => {
						console.error(err);
					}
				);
				project.__v++;
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
