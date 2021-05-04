import { ChangeDetectorRef, Component, Input, Output, ViewChild, Inject } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MAT_DIALOG_SCROLL_STRATEGY_FACTORY } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ElementRef } from '@angular/core';
import { fabric } from "fabric";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSidenav } from '@angular/material/sidenav';
import { AbstractControl, FormGroup, FormControl, Validators, ValidatorFn } from '@angular/forms';
import { FileValidator } from 'ngx-material-file-input';
import { ThemePalette } from '@angular/material/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatChip, MatChipInputEvent, MatChipList, MatChipSelectionChange } from '@angular/material/chips';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { Asset, AssetCollection, Project, ProjectService, Tag, RegionGroup } from 'src/app/services/project.service';
import { environment } from 'src/environments/environment';
import { CollectionDialogComponent } from './collection-dialog.component';
import { AssetUploadDialogComponent } from './asset-upload-dialog.component';
import { forkJoin } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { Color, stringInputToObject } from '@angular-material-components/color-picker';


enum DisplayType {
	Asset = "Asset", Collection = "Collection"
}

export class TagDialogData {
	tags: Tag[];
}

interface Drawable {
	type: DisplayType;
	id: string;
	ref: Asset | AssetCollection;
	image: fabric.Group;
	regionGroups: fabric.Object[][];
}

@Component({
	selector: 'project-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss'],
})
export class EditorComponent {
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
	reloadProject = new EventEmitter<(param: { project: Project, oldProject: Project, newAssets: { asset: Asset, index: number }[] }) => void>();

	@Output()
	dirty = new EventEmitter<void>();

	@Output()
	editRegionGroup = new EventEmitter<{ regionGroup: { asset: Asset, index: number }, callback: (() => void) }>();

	@ViewChild('myCanvas')
	myCanvas: ElementRef<HTMLCanvasElement>;

	@ViewChild('rightNav')
	rightNav: MatSidenav;

	@ViewChild('projectTagList')
	projectTagList: MatChipList;

	drawables = new Map<{ type: DisplayType, id: string }, Drawable>();
	treeControl = new NestedTreeControl<Drawable | { type: DisplayType, ref: Asset }>(
		node => {
			return node.type == DisplayType.Collection ?
				(node.ref as AssetCollection).assets.map(assetIndex => ({ type: DisplayType.Asset, ref: this.project.assets[assetIndex] })) :
				[];
		}
	);
	dataSource = new MatTreeNestedDataSource<Drawable | Asset>();
	selectedElement: Drawable;
	assetTags: Tag[];
	canvas: fabric.Canvas;
	selectedNonDrawable = false;
	isDraggingCanvas = false;
	separatorKeysCodes: number[] = [ENTER, COMMA];
	tagCtrl = new FormControl();
	filteredTags: Observable<Tag[]>;
	selectedTag: Tag;
	tagColorCtr = new FormControl();;

	hasChild = (_: number, node: Drawable | { type: DisplayType, ref: Asset }) =>
		node.type == DisplayType.Collection &&
		(node.ref as AssetCollection).assets.length > 0;

	constructor(
		private projectService: ProjectService,
		private dialog: MatDialog,
		private snackBar: MatSnackBar,
		private cdRef: ChangeDetectorRef
	) {
		this.dataSource.data = [];
		this.filteredTags = this.tagCtrl.valueChanges.pipe(
			startWith(null as string),
			map((tag: string | null) => tag ? this._filter(tag) : this.project.projectTags.filter(tag => !this.assetTags?.some(assetTag => assetTag.name == tag.name)).slice()));
		this.tagColorCtr.valueChanges.subscribe((color: Color) => {
			this.selectedTag.color = color?.toHexString();
			this.dirty.emit();
		});
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
									({ project, newAssets }) => {
										this._project = project;

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

	onProjectChangedFromDifferentEditor(): void {
		this.addProjectToCanvas();
	}
	ngAfterViewChecked() {
		this.cdRef.detectChanges();
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
			renderOnAddRemove: false,
		});

		// Disable context menu
		fabric.util.addListener(document.getElementsByClassName('upper-canvas')[0] as HTMLElement, 'contextmenu', function (e: { preventDefault: () => void; }) {
			e.preventDefault();
		});

		this.canvas.on('selection:cleared', opt => {
			if (!this.selectedNonDrawable) {
				// Make all regions on the selected element invisible
				this.selectedElement.regionGroups.forEach(regionGroup => regionGroup.forEach(regionImg => regionImg.visible = false));
				this.selectedElement.image.dirty = this.selectedElement.regionGroups.some(regionGroup => regionGroup.length > 0);

				// Then deselect the element
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
					vpt[4] = this.canvas.getWidth() - totalWidth * zoom / 2;
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
			this.canvas.requestRenderAll();
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
						vpt[4] = this.canvas.getWidth() - totalWidth * zoom / 2;
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
				this.canvas.requestRenderAll();
			}
		});

		this.canvas.on('mouse:up', opt => {
			this.isDraggingCanvas = false;
			this.canvas.selection = true;

			this.canvas.setCursor('default');

			opt.e.preventDefault();
		});

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

		this.drawables = new Map(this.project.assets
			.filter(asset => asset.assetCollection === undefined)
			.map((asset): Drawable => {
				let re: Drawable = {
					image: null,
					ref: asset,
					type: DisplayType.Asset,
					id: asset._id,
					regionGroups: [],
				};

				this.loadDrawableImage(re, asset.url, asset.regionGroups);

				return re;
			}).concat(this.project.assetCollections
				.filter(collection => collection.assets.length > 0)
				.map((collection): Drawable => {
					let re: Drawable = {
						image: null,
						ref: collection,
						type: DisplayType.Collection,
						id: collection._id,
						regionGroups: [],
					};

					this.loadDrawableImage(re, collection.url || this.project.assets[collection.assets[0]].url, []);

					return re;
				})).map(drawable => [
					{
						type: drawable.type,
						id: drawable.id,
					},
					drawable,
				]));

		this.dataSource.data = Array.from(this.drawables.values());
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
				strokeWidth: 3,
			}));
		}

		for (let y = 1; y < totalHeight / grid; y++) {
			this.canvas.add(new fabric.Line([-totalWidth / 2, y * grid - totalHeight / 2, totalWidth / 2, y * grid - totalHeight / 2], {
				stroke: 'Gainsboro',
				selectable: false,
				evented: false,
				strokeWidth: 3,
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
			console.log("something")
		}
	}

	newCollection(defaultSelection: number[]): void {
		let assets = this.project.assets
			.map((asset, index) => ({ asset, index }))
			.filter(({ asset }) => asset.assetCollection === undefined);
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

	newTag() {
		const dialogRef = this.dialog.open(TagDialogComponent, {
			width: '400px',
			data: {
				tags: this.project.projectTags
			}
		});

		dialogRef.afterClosed().subscribe((re) => {
			if (re !== undefined) {
				let { newTag } = re;
				this.project.projectTags.push(newTag);
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

	loadDrawableImage(drawable: Drawable, url: string, regions: RegionGroup[]): void {
		drawable.ref.position ??= {
			x: 0,
			y: 0
		}
		drawable.ref.scale ??= {
			x: 1,
			y: 1
		}
		drawable.ref.angle ??= 0;

		fabric.Image.fromURL(url, img => {
			let regionImgs = regions.map(regionGroup =>
				regionGroup.regions.map(
					region => {
						let shape: fabric.Rect | fabric.Circle;
						const globalOptions: fabric.IRectOptions = {
							fill: (regionGroup.color ?? environment.editor.regions.defaultRegionGroupColor) + environment.editor.regions.regionFillTransparency,
							stroke: (regionGroup.color ?? environment.editor.regions.defaultRegionGroupColor),
							strokeWidth: 10,
							strokeDashArray: [20, 20],
							originX: 'center',
							originY: 'center',
							visible: false,
						};

						if (region.shape == 'Square') {
							shape = new fabric.Rect({
								width: .1 * img.width,
								height: .1 * img.height,
								...region.params.nonpoly,
								...globalOptions,
							});
						} else if (region.shape == 'Circle') {
							shape = new fabric.Circle({
								radius: .05 * (img.width + img.height),
								...region.params.nonpoly,
								...globalOptions,
							});
						}
						return shape;
					}
				)
			);

			let group = new fabric.Group([img, ...regionImgs.flat()], {
				left: drawable.ref.position.x,
				top: drawable.ref.position.y,
				scaleX: drawable.ref.scale.x,
				scaleY: drawable.ref.scale.y,
				angle: drawable.ref.angle,
			});

			drawable.image = group;
			drawable.regionGroups = regionImgs;

			this.addDrawableEvents(drawable);
			this.canvas.add(group);
			this.canvas.requestRenderAll();
		}, {
			originX: 'center',
			originY: 'center',
		});
	}

	addDrawableEvents(drawable: Drawable): void {
		drawable.image.on('selected', e => {
			this.selectedElement = drawable;
			(this.projectTagList.selected as MatChip)?.deselect();
			this.assetTags = this.selectedElement.ref.tags.map(tag => this.project.projectTags[tag.index]);
			console.log('Setting asset tags to', this.assetTags);

			if (drawable.type == DisplayType.Asset) {
				drawable.regionGroups.forEach(
					(regionGroup, groupIndex) => regionGroup.forEach(
						region => {
							region.visible = (drawable.ref as Asset).regionGroups[groupIndex].visible;
						}));

				// Need to set dirty flag, otherwise Fabric will assume that each invisible
				// group member is still invisible
				drawable.image.dirty = true;

				this.canvas.requestRenderAll();
			}

			this.rightNav.open();
			this.tagCtrl.reset();
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


	tagDrop(event: CdkDragDrop<Tag[]>) {
		if (event.previousContainer === event.container) {
			moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
			if (event.previousContainer.id == "rightList") {
				moveItemInArray(this.selectedElement.ref.tags, event.previousIndex, event.currentIndex)
				this.dirty.emit();
			} else if (event.previousContainer.id == 'leftList') {
				this.project.assets.forEach(asset =>
					asset.tags.forEach(tag =>
						tag.index = (tag.index == event.previousIndex ?
							event.currentIndex :
							(tag.index == event.currentIndex ? event.previousIndex : tag.index))));

				this.project.assetCollections.forEach(collection =>
					collection.tags.forEach(tag =>
						tag.index = (tag.index == event.previousIndex ?
							event.currentIndex :
							(tag.index == event.currentIndex ? event.previousIndex : tag.index))));
			}
		}
		else {
			let tag = this.project.projectTags[event.previousIndex];
			this.assetTags.splice(event.currentIndex, 0, tag);
			this.selectedElement.ref.tags.splice(event.currentIndex, 0, { index: event.previousIndex, properties: tag.properties.map(() => null) });
			console.log("dropping off tag from to assetTags")
			this.dirty.emit();
		}

	}

	@ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;
	@ViewChild('auto') matAutocomplete: MatAutocomplete;


	private _filter(value: string): Tag[] {
		console.log(value);
		const filterValue = value.toLowerCase();
		return this.project.projectTags.filter(tag => tag.name.toLowerCase().indexOf(filterValue) === 0 && !this.assetTags.some(assetTag => assetTag.name == tag.name));
	}

	add(event: MatChipInputEvent): void {
		const input = event.input;
		const value = event.value;

		let index = this.project.projectTags.findIndex(tag => tag.name == value);
		if (index > -1) {
			let tag = this.project.projectTags[index];
			this.assetTags.push(tag);
			this.selectedElement.ref.tags.push({ index, properties: tag.properties.map(() => null) });
			this.dirty.emit();
		}
		// Reset the input value
		if (input) {
			input.value = '';
		}

		this.tagCtrl.setValue(null);
	}

	remove(tag: Tag): void {
		const index = this.assetTags.indexOf(tag);

		if (index >= 0) {
			this.assetTags.splice(index, 1);
			this.selectedElement.ref.tags.splice(index, 1)
			this.dirty.emit();
		}
	}

	selectTag(tag: Tag, event: MatChipSelectionChange) {

		if (event.selected) {
			this.selectedTag = tag;
			this.canvas.discardActiveObject();
			this.rightNav.open();
			this.canvas.requestRenderAll();

			if (tag.color) {
				let temp = tag.color ? stringInputToObject(tag.color) : null;
				this.tagColorCtr.setValue(new Color(temp.r, temp.g, temp.b), { emitEvent: false });
			} else {
				this.tagColorCtr.setValue(null, { emitEvent: false });
			}
		} else if (this.selectedTag == tag) {
			this.selectedTag = null;

			if (!this.selectedElement)
				this.rightNav.close();
		}

	}

	selected(event: MatAutocompleteSelectedEvent): void {
		let index = this.project.projectTags.findIndex(tag => tag.name == event.option.viewValue);
		let tag = this.project.projectTags[index];
		this.assetTags.push(tag);
		this.selectedElement.ref.tags.push({ index, properties: tag.properties.map(() => null) });
		this.dirty.emit();
		this.tagInput.nativeElement.value = '';
		this.tagCtrl.setValue(null);
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
					this.uploadNewAssets(files, collection === -1, collection);
				}
			}
		)
	}

	newRegionGroup(asset: Asset): void {
		asset.regionGroups.push({
			regions: [],
			visible: true,
			maps: [],
		});
		this.dirty.emit();
	}

	asAsset(drawable: Drawable): Asset {
		if (drawable.type == DisplayType.Asset) {
			return drawable.ref as Asset;
		} else {
			throw new Error('Drawable not actually an asset!');
		}
	}

	deleteRegionGroupFromSelected(regionGroupIndex: number): void {
		this.selectedElement.regionGroups[regionGroupIndex].forEach(
			regionImg => this.selectedElement.image.removeWithUpdate(regionImg)
		);
		(this.selectedElement.ref as Asset).regionGroups.splice(regionGroupIndex, 1);
		this.selectedElement.regionGroups.splice(regionGroupIndex, 1);
		this.canvas.requestRenderAll();
	}

	changeRegionGroupColor(regionGroupIndex: number): void {
		let regionGroup = (this.selectedElement.ref as Asset).regionGroups[regionGroupIndex];
		this.selectedElement.regionGroups[regionGroupIndex].forEach(
			regionImg => {
				regionImg.fill = (regionGroup.color ?? environment.editor.regions.defaultRegionGroupColor) + environment.editor.regions.regionFillTransparency;
				regionImg.stroke = (regionGroup.color ?? environment.editor.regions.defaultRegionGroupColor);
			}
		)
		// Must be marked dirty so that group sub-objects get updated
		this.selectedElement.image.dirty = true;
		this.canvas.requestRenderAll();
	}

	regionGroupEditedCallback(): () => void {
		return () => {
			// In the region editor, we may have changed the number of regions in a region group.
			// There should be a better way to do this, but I'm crunched on time so
			// instead I'm just going to reload the whole project. 🤷
			this.addProjectToCanvas();
		};
	}

	changeGroupVisibility(regionGroupIndex: number): void {
		let group = (this.selectedElement.ref as Asset).regionGroups[regionGroupIndex];
		group.visible = !group.visible;

		this.selectedElement.regionGroups[regionGroupIndex].forEach(regionImg => regionImg.visible = group.visible);
		this.selectedElement.image.dirty = true;
		this.canvas.requestRenderAll();
	}

	newProperty(): void {
		this.selectedTag.properties.push({
			name: `Property ${this.selectedTag.properties.length + 1}`,
			dataType: 'number',
		});
		this.project.assets.forEach(asset => asset.tags.find(assetTag => this.project.projectTags[assetTag.index] == this.selectedTag)?.properties.push(null));
		this.dirty.emit();
	}

};

function UniqueTagNameValidator(tags: Tag[]): ValidatorFn {
	return (control: AbstractControl): { [key: string]: any } | null => {
		const forbidden = tags.some((tag) => tag.name == control.value);
		return forbidden ? { uniqueTagName: { value: control.value } } : null;
	};
}

@Component({
	selector: 'tag-dialog',
	templateUrl: 'tag-dialog.component.html',
})
export class TagDialogComponent {
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
		name: new FormControl('', [Validators.required, UniqueTagNameValidator(this.data.tags)]),
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
			newTag: {
				name: this.newTagForm.get("name").value,
				color: this.colorCtr.value?.toHexString(),
				properties: [],
			},
		});
	}
}