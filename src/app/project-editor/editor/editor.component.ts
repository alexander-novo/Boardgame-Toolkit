import { Component, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Asset, AssetCollection, Project, ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ElementRef } from '@angular/core';
import { fabric } from "fabric";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { environment } from 'src/environments/environment';
import { CollectionDialogComponent } from './collection-dialog.component';
import { AssetUploadDialogComponent } from './asset-upload-dialog.component';
import { forkJoin } from 'rxjs';
import { EventEmitter } from '@angular/core';


enum DisplayType {
	Asset = "Asset", Collection = "Collection"
}

interface Drawable {
	type: DisplayType;
	id: string;
	ref: Asset | AssetCollection;
	image: fabric.Image;
}

@Component({
	selector: 'project-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {
	eDisplayType = DisplayType;
	environment = environment;

	private _project: Project;
	@Input()
	get project(): Project { return this._project; }
	set project(proj: Project) {
		this._project = proj;
		this.addProjectToCanvas();
	}

	@Input()
	projectId: string;

	@Output()
	reloadProject = new EventEmitter<(param: { oldProject: Project, newAssets: { asset: Asset, index: number }[] }) => void>();

	@Output()
	dirty = new EventEmitter<void>();

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
	turnNewAssetsIntoCollection = false;
	currentDragAsset: Drawable;
	selectedNonDrawable = false;
	isDraggingCanvas = false;

	@ViewChild('rightNav')
	rightNav: MatSidenav;

	hasChild = (_: number, node: Drawable | { type: DisplayType, ref: Asset }) =>
		node.type == DisplayType.Collection &&
		(node.ref as AssetCollection).assets.length > 0;

	constructor(
		private projectService: ProjectService,
		private dialog: MatDialog,
		private snackBar: MatSnackBar
	) {
		this.dataSource.data = [];
	}

	ngOnInit(): void {

	}

	onFileDrop(event: Array<File>) {
		this.uploadNewAssets(event);
	}

	uploadNewAssets(files: File[], createNewCollection?: boolean, collectionIndex?: number) {
		createNewCollection ??= files.length > 1;
		// Save the project first, then create new assets on the server
		// Upload images to new asset urls, then pull project down from server
		this.projectService.saveProject(this.projectId, this.project).subscribe(
			() => {
				this.snackBar.open("Project Saved", undefined, { duration: environment.editor.autoSaveBarDuration });
				this.projectService.createNewAssets(this.projectId, files).subscribe(
					uploadUrls => {
						forkJoin(uploadUrls.map((url, index) => {
							return this.projectService.uploadAsset(url, files[index]);
						}, this)).subscribe(
							() => {
								this.reloadProject.emit(
									({ newAssets }) => {
										console.log("Exciting!", { newAssets, createNewCollection, collectionIndex });
										if (createNewCollection) {
											this.newCollection(newAssets.map(({ asset, index }) => index))
										} else if (collectionIndex !== undefined) {
											let collection = this.project.assetCollections[collectionIndex];
											newAssets.forEach(({ asset, index }) => {
												asset.assetCollection = collectionIndex;
												collection.assets.push(index);
											});
										}
									}
								)
							},
							err => console.log(err)
						);
					},
					err => console.error(err),
					() => { }
				)
			}
		)
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
		fabric.util.addListener(document.getElementsByClassName('upper-canvas')[0] as HTMLElement, 'contextmenu', function (e: { preventDefault: () => void; }) {
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

			// Let the workspace know the project is dirty
			this.dirty.emit();
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

				this.dirty.emit();

				this.canvas.setCursor('grabbing');
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
		console.log("Got a default selection: ", defaultSelection);
		let assets = this.project.assets
			.map((asset, index) => ({ asset, index }))
			.filter(({ asset }) => asset.assetCollection === undefined);
		console.log("Assets: ", assets);
		const dialogRef = this.dialog.open(CollectionDialogComponent, {
			width: '450px',
			data: {
				defaultSelection,
				assets,
			}
		});

		dialogRef.afterClosed().subscribe(re => {
			if (re !== undefined) {
				let { newCollection, file } = re;
				this.project.assetCollections.push(newCollection);
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
										() => this.reloadProject.emit()
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

			this.dirty.emit();
		});
	}

	uploadAssetsPopup() {
		const dialogRef = this.dialog.open(AssetUploadDialogComponent, {
			width: '450px',
			data: {
				collections: this.project.assetCollections.map((collection, index) => ({ collection, index })),
			},
		});

		dialogRef.afterClosed().subscribe(
			re => {
				if (re !== undefined) {
					let { files, collection } = re;
					console.log("Collection selected: " + collection);
					this.uploadNewAssets(files, collection === -1, collection);
				}
			}
		)
	}

	newRegionGroup(asset: Asset): void {
		asset.regionGroups.push({
			regions: [],
			visible: true,
		});
	}

	asAsset(drawable: Drawable): Asset {
		if (drawable.type == DisplayType.Asset) {
			return drawable.ref as Asset;
		} else {
			throw new Error('Drawable not actually an asset!');
		}
	}
}