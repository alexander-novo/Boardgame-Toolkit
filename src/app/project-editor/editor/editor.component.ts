import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { Asset, AssetCollection, Project, ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ElementRef } from '@angular/core';
import { fabric } from "fabric";
import { MatSnackBar } from '@angular/material/snack-bar';

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
	dirty = false;
	shouldsave = true;
	expectingNewAssets = false;
	currentDragAsset: Drawable;
	selectedNonDrawable = false;

	hasChild = (_: number, node: Drawable | { type: DisplayType, ref: Asset }) =>
		node.type == DisplayType.Collection &&
		(node.ref as AssetCollection).assets.length > 0;

	constructor(
		private route: ActivatedRoute,
		private projectService: ProjectService,
		private dialog: MatDialog,
		private snackBar: MatSnackBar
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
				this.snackBar.open("Project Saved");
				this.projectService.createNewAssets(this.projectId, event).subscribe(
					uploadUrls => {
						console.log(uploadUrls);

						if (uploadUrls.length > 1) {
							this.expectingNewAssets = true;
						}

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
				if (this.expectingNewAssets) {
					let newAssets = project.assets.filter(newAsset => !this.project.assets.some(oldAsset => oldAsset._id == newAsset._id));
					this.expectingNewAssets = false;
				}

				this.project = project;
				this.addProjectToCanvas();

				console.log(this.project);
			},
			err => {
				console.error(err);
			},
			() => { }
		);
	}

	ngAfterViewInit(): void {
		// Make canvas pixel size the same as it actually is on the DOM (css set to 100%)
		let canvas = this.myCanvas.nativeElement;
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;

		fabric.Object.prototype.borderColor = 'LimeGreen';
		fabric.Object.prototype.cornerColor = 'black';
		fabric.Object.prototype.borderScaleFactor = 2;
		fabric.Object.prototype.borderDashArray = [5, 5];
		this.canvas = new fabric.Canvas(canvas);

		this.canvas.on('selection:cleared', e => {
			if (!this.selectedNonDrawable) {
				this.selectedElement = null;
			}
			this.selectedNonDrawable = false;
		});

		this.addProjectToCanvas();

		// Auto save every 5 seconds if the project is dirty
		setInterval(() => {
			if (this.dirty && this.shouldsave) {
				console.log(this.project);
				this.projectService.saveProject(this.projectId, this.project).subscribe(
					() => { this.snackBar.open("Project Saved", undefined, { duration: 1000 }); }
				);
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
				let re: Drawable = {
					image: null,
					ref: asset,
					type: DisplayType.Asset,
					id: asset._id,
				};

				this.loadDrawableImage(re, asset.url);

				return re;
			}).concat(this.project.assetCollections
				.filter(collection => collection.assets.length > 0)
				.map((collection): Drawable => {
					let re: Drawable = {
						image: null,
						ref: collection,
						type: DisplayType.Collection,
						id: collection._id,
					};

					this.loadDrawableImage(re, this.project.assets[collection.assets[0]].url);

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
			this.selectedNonDrawable = false;
			this.canvas.setActiveObject(item.image);
			this.canvas.renderAll();
		} else {
			this.selectedNonDrawable = true;
			this.canvas.discardActiveObject();
			this.selectedNonDrawable = false;
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

		dialogRef.afterClosed().subscribe(newCollection => {
			if (newCollection !== undefined) {
				this.project.assetCollections.push(newCollection);
				for (let index of newCollection.assets) {
					this.project.assets[index].assetCollection = this.project.assetCollections.length - 1;
				}

				this.projectService.saveProject(this.projectId, this.project).subscribe(
					() => {
						this.snackBar.open("Project Saved");
					},
					err => {
						console.error(err);
					}
				);
				this.project.__v++;
			}
		});
	}

	loadDrawableImage(drawable: Drawable, url: string): void {
		if (drawable.ref.position === undefined) {
			drawable.ref.position = {
				x: 0,
				y: 0
			}
		}

		if (drawable.ref.scale === undefined) {
			drawable.ref.scale = {
				x: 0,
				y: 0
			}
		}

		drawable.ref.angle = drawable.ref.angle || 0;

		fabric.Image.fromURL(url, img => {
			drawable.image = img;

			this.addDrawableEvents(drawable);
			this.canvas.add(img);
		}, {
			left: drawable.ref.position.x,
			top: drawable.ref.position.y,
			scaleX: drawable.ref.scale.x,
			scaleY: drawable.ref.scale.y,
			angle: drawable.ref.angle,
		});
	}

	addDrawableEvents(drawable: Drawable): void {
		drawable.image.on('selected', e => {
			console.log("Selected drawable");
			this.selectedElement = drawable;
			console.log(this.selectedElement);
		});

		drawable.image.on('modified', e => {
			drawable.ref.position = {
				x: drawable.image.left,
				y: drawable.image.top,
			};
			drawable.ref.scale = {
				x: drawable.image.scaleX,
				y: drawable.image.scaleY,
			};
			drawable.ref.angle = drawable.image.angle;

			this.dirty = true;
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
