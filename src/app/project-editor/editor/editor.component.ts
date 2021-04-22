import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MAT_DIALOG_SCROLL_STRATEGY_FACTORY } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { Asset, AssetCollection, Project, ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ElementRef } from '@angular/core';
import { fabric } from "fabric";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { AbstractControl, FormGroup, FormControl, Validators } from '@angular/forms';
import { FileValidator } from 'ngx-material-file-input';
import { environment } from 'src/environments/environment';
import {MatChipsModule} from '@angular/material/chips'; 
import { ThemePalette } from '@angular/material/core';



enum DisplayType {
	Asset = "Asset", Collection = "Collection"
}

export class CollectionDialogData {
	newCollection: {
		name: string,
		assets: Array<number>,
	};
	assets: Array<{ asset: Asset, index: number }>;
	defaultSelection: Array<number>;
}

export class TagDialogData{
	newTag: {
		name: string,
		//dataString: string,
		//dataNumber: number,
		//assets: Array<number>,
	}
	//assets: Array<{asset: Asset, index: number}>;
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
	eDisplayType = DisplayType;
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
	isDraggingCanvas = false;

	@ViewChild('rightNav')
	rightNav: MatSidenav;

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
				this.snackBar.open("Project Saved", undefined, { duration: environment.editor.autoSaveBarDuration });
				this.projectService.createNewAssets(this.projectId, event).subscribe(
					uploadUrls => {
						console.log(uploadUrls);

						if (uploadUrls.length > 1) {
							this.expectingNewAssets = true;
							console.log("exepcting collection of assets")
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

				console.log("afer dialog box");

				let oldProject = this.project;
				this.project = project;
				this.addProjectToCanvas();

				if (this.expectingNewAssets) {
					//array of new assets greater than 1
					let assets = project.assets.map((asset, index) => ({ asset, index })).filter(({ asset, index }) => !oldProject.assets.some(oldAsset => oldAsset._id == asset._id));
					this.newCollection(assets.map(({ asset, index }) => index))
					console.log("expecting to opendialog box");
					this.expectingNewAssets = false;
				}
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
		this.canvas = new fabric.Canvas(canvas, {
			fireRightClick: true,
		});

		// Disable context menu
		fabric.util.addListener(document.getElementsByClassName('upper-canvas')[0] as HTMLElement, 'contextmenu', function (e) {
			e.preventDefault();
		});

		this.canvas.on('selection:cleared', opt => {
			if (!this.selectedNonDrawable) {
				this.selectedElement = null;
				this.rightNav.close();
			}
			this.selectedNonDrawable = false;
		});

		this.canvas.on('mouse:wheel', opt => {
			let e = (opt.e as WheelEvent);
			let delta = e.deltaY;

			let { maxZoom, minZoom, totalWidth, totalHeight, zoomSpeed } = environment.editor.workspace;

			let zoom = Math.min(Math.max((1 - zoomSpeed) ** delta * this.canvas.getZoom(), minZoom), maxZoom);
			e.preventDefault();
			e.stopPropagation();

			this.canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom);

			let vpt = this.canvas.viewportTransform;
			if (zoom < Math.min(canvas.width / totalWidth, canvas.height / totalHeight)) {
				vpt[4] = 0;
				vpt[5] = 0;
			} else {
				if (vpt[4] >= totalWidth * zoom / 2) {
					vpt[4] = totalWidth * zoom / 2;
				} else if (vpt[4] < this.canvas.getWidth() - totalWidth * zoom / 2) {
					vpt[4] = this.canvas.getWidth() - totalHeight * zoom / 2;
				}
				if (vpt[5] >= totalHeight * zoom / 2) {
					vpt[5] = totalHeight * zoom / 2;
				} else if (vpt[5] < this.canvas.getHeight() - totalHeight * zoom / 2) {
					vpt[5] = this.canvas.getHeight() - totalHeight * zoom / 2;
				}
			}

			this.project.camera.zoom = zoom;
			this.project.camera.x = vpt[4];
			this.project.camera.y = vpt[5];
			this.dirty = true;
		});

		this.canvas.on('mouse:down', opt => {
			let e = (opt.e as MouseEvent);

			// If right-click
			if (e.button == 2) {
				this.isDraggingCanvas = true;
				this.canvas.selection = false;

				this.canvas.setCursor('grabbing');

				e.preventDefault();
			}
		});

		this.canvas.on('mouse:move', opt => {
			let e = (opt.e as MouseEvent);

			if (this.isDraggingCanvas) {
				let { totalWidth, totalHeight } = environment.editor.workspace;
				let zoom = this.canvas.getZoom();
				let vpt = this.canvas.viewportTransform;
				if (zoom < Math.min(canvas.width / totalWidth, canvas.height / totalHeight)) {
					vpt[4] = 0;
					vpt[5] = 0;
				} else {
					vpt[4] += e.movementX;
					vpt[5] += e.movementY;
					if (vpt[4] >= totalWidth * zoom / 2) {
						vpt[4] = totalWidth * zoom / 2;
					} else if (vpt[4] < this.canvas.getWidth() - totalWidth * zoom / 2) {
						vpt[4] = this.canvas.getWidth() - totalHeight * zoom / 2;
					}
					if (vpt[5] >= totalHeight * zoom / 2) {
						vpt[5] = totalHeight * zoom / 2;
					} else if (vpt[5] < this.canvas.getHeight() - totalHeight * zoom / 2) {
						vpt[5] = this.canvas.getHeight() - totalHeight * zoom / 2;
					}
				}

				this.project.camera.x = vpt[4];
				this.project.camera.y = vpt[5];
				this.dirty = true;

				this.canvas.setViewportTransform(this.canvas.viewportTransform);
				this.canvas.requestRenderAll();
			}
		});

		this.canvas.on('mouse:up', opt => {
			this.canvas.setViewportTransform(this.canvas.viewportTransform);
			this.isDraggingCanvas = false;
			this.canvas.selection = true;

			this.canvas.setCursor('default');

			opt.e.preventDefault();
		})

		this.addProjectToCanvas();

		// Auto save every 5 seconds if the project is dirty
		setInterval(() => {
			if (this.dirty && this.shouldsave) {
				console.log(this.project);
				this.projectService.saveProject(this.projectId, this.project).subscribe(
					() => { this.snackBar.open("Project Saved", undefined, { duration: environment.editor.autoSaveBarDuration }); }
				);
				this.project.__v++;
				this.dirty = false;
			}
		}, environment.editor.autoSaveInterval)
	}

	addProjectToCanvas(): void {
		if (!this.project || !this.canvas) {
			return;
		}

		console.log("Adding assets to canvas...");
		this.canvas.clear();

		this.canvas.setZoom(this.project.camera.zoom);
		let vpt = this.canvas.viewportTransform;
		vpt[4] = this.project.camera.x;
		vpt[5] = this.project.camera.y;

		this.drawGridAndBounds();

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

					this.loadDrawableImage(re, collection.url || this.project.assets[collection.assets[0]].url);

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

	drawGridAndBounds(): void {
		let { boundsStrokeWidth, totalHeight, totalWidth, grid } = environment.editor.workspace;
		// Border around bounds
		this.canvas.add(new fabric.Rect({
			selectable: false,
			evented: false,
			width: totalWidth - boundsStrokeWidth,
			height: totalHeight - boundsStrokeWidth,
			stroke: 'red',
			strokeWidth: boundsStrokeWidth,
			fill: '',
			left: -totalWidth / 2,
			top: -totalHeight / 2,
			opacity: 1,
		}));

		for (let x = 1; x < totalWidth / grid; x++) {
			this.canvas.add(new fabric.Line([x * grid - totalWidth / 2, -totalHeight / 2, x * grid - totalWidth / 2, totalHeight / 2], {
				stroke: 'Gainsboro',
				selectable: false,
				evented: false,
				strokeWidth: 1,
			}));
		}

		for (let y = 1; y < totalHeight / grid; y++) {
			this.canvas.add(new fabric.Line([-totalWidth / 2, y * grid - totalHeight / 2, totalWidth / 2, y * grid - totalHeight / 2], {
				stroke: 'Gainsboro',
				selectable: false,
				evented: false,
				strokeWidth: 1,
			}));
		}
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

	newCollection(defaultSelection: number[]): void {
		let newCollectionName: string = '';

		const dialogRef = this.dialog.open(CollectionDialogComponent, {

			width: '400px',
			data: {
				newCollection: {
					name: newCollectionName,
					assets: [],
				},
				defaultSelection,
				assets: this.project.assets.filter(asset => asset.assetCollection === undefined).map((asset, index) => { return { asset, index } }),
			}
		});


		dialogRef.afterClosed().subscribe(({ newCollection, file }) => {
			if (newCollection !== undefined) {
				this.project.assetCollections.push(newCollection);
				//what this loop is for?
				for (let index of newCollection.assets) {
					this.project.assets[index].assetCollection = this.project.assetCollections.length - 1;
				}

				this.addProjectToCanvas();
				this.projectService.saveProject(this.projectId, this.project).subscribe(
					() => {
						this.snackBar.open("Project Saved", undefined, { duration: environment.editor.autoSaveBarDuration });
						if (file != null && file.files !== undefined) {
							this.projectService.addThumbnailToCollection(this.projectId, this.project.assetCollections.length - 1, file).subscribe(
								(uploadUrl) => {
									this.projectService.uploadAsset(uploadUrl, file.files[0]).subscribe(
										() => {
											this.refreshProject();
										}
									);
								}
							);
						}
					},
					err => {
						console.error(err);
					}
				);
				this.project.__v++;
			}
		});
	}

	newTag(){
		let newTagName: string = '';
		const dialogRef = this.dialog.open(TagDialogComponent, {

			width: '400px',
			data: {
				newTag: {
					name: newTagName,
				}
			}
		});

		dialogRef.afterClosed().subscribe(({newTag})=> {
			if (newTag !== undefined) {
				this.project.projectTags.push(newTag);
				console.log("New Tag Uploaded! Check MongoDB");
				this.projectService.saveProject(this.projectId, this.project).subscribe(
					() => { this.snackBar.open("Project Saved", undefined, { duration: environment.editor.autoSaveBarDuration }); },
					err => {
						console.log(err);
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
				x: 1,
				y: 1
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
			this.selectedElement = drawable;

			this.rightNav.open();
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
	defaultSelection: Asset[];
	@ViewChild('collectionList') collectionList: MatSelectionList;
	newCollectionForm = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(4)]),
		backFile: new FormControl('', [FileValidator.maxContentSize(4000000)]),
	});

	constructor(
		public dialogRef: MatDialogRef<CollectionDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: CollectionDialogData) { }



	ngAfterViewInit() {
		console.log(this.data);
	}


	onNoClick(): void {
		this.dialogRef.close();
	}

	onOkClick(): void {
		this.dialogRef.close({
			newCollection: {
				name: this.data.newCollection.name,
				assets: this.collectionList.selectedOptions.selected.map(option => option.value),
			},
			file: this.newCollectionForm.get('backFile').value
		});
	}

};
@Component({
	selector: 'tag-dialog',
	templateUrl: 'tag-dialog.component.html',
})

export class TagDialogComponent{
	//@ViewChild('tagList') tagList: MatSelectionList;
	public disabled = false;
	public color: ThemePalette = 'primary';
	public touchUi = false;

  	colorCtr: AbstractControl = new FormControl(null);

	public options = [
		{ value: true, label: 'True' },
		{ value: false, label: 'False' }
	];

  	public listColors = ['primary', 'accent', 'warn'];

	newTagForm = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(4)]),
		//data: new FormControl('',)
	});

	constructor(
		public dialogRef: MatDialogRef<TagDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: TagDialogData) { }

	ngAfterViewInit() {
		console.log(this.data);
	}

	onNoClick(): void {
		this.dialogRef.close();
	}
	onOkClick(): void {
		this.dialogRef.close({
			newTag:{
				name: this.data.newTag.name,
				//dataString: this.data.newTag.dataString
				//dataNumber: this.data.newTag.dataNumber
			},
		});
	}
}
