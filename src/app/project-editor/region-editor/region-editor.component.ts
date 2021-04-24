import { Color, stringInputToObject } from '@angular-material-components/color-picker';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { MatSelectionListChange } from '@angular/material/list';
import { ResizeSensor } from 'css-element-queries';
import { fabric } from "fabric";
import { environment } from 'src/environments/environment';
import { Asset, Region, RegionGroup } from '../../services/project.service';

interface DrawableRegion {
	region: Region;
	img: fabric.Object;
}

@Component({
	selector: 'app-region-editor',
	templateUrl: './region-editor.component.html',
	styleUrls: ['./region-editor.component.scss']
})
export class RegionEditorComponent {
	environment = environment;

	@Input()
	get assetGroupIndex() { return { asset: this.asset, index: this.index }; }
	set assetGroupIndex({ asset, index }) {
		this.asset = asset;
		this.index = index;
		this.group = asset?.regionGroups[index];

		let temp = stringInputToObject(this.group.color ?? environment.editor.regions.defaultRegionGroupColor);
		this.colorCtr = new FormControl(
			new Color(temp.r, temp.g, temp.b)
		);
		this.colorCtr.valueChanges.subscribe((color: Color) => {
			this.group.color = color.toHexString();
			console.log('Changed color to ', this.group.color);
			this.drawables.forEach(drawable => {
				drawable.img.set({
					fill: this.group.color + environment.editor.regions.regionFillTransparency,
					stroke: this.group.color,
				});
			});
			this.dirty.emit();
			this.canvas?.requestRenderAll();
		})
	}

	@Output()
	dirty = new EventEmitter<void>();

	@ViewChild('myCanvas')
	myCanvas: ElementRef<HTMLCanvasElement>;

	asset: Asset;
	index: number;
	groupColor: Color;
	colorCtr: AbstractControl;
	group: RegionGroup;
	canvas: fabric.Canvas;
	assetImg: fabric.Image;
	isDraggingCanvas = false;
	newRegionType: 'Square' | 'Circle' | 'Polygon';
	selectedRegion: DrawableRegion;
	drawables: DrawableRegion[] = [];

	// TODO: look into destroying this
	private resizeSensor: ResizeSensor;

	constructor() { }

	ngAfterViewInit(): void {
		// Make canvas pixel size the same as it actually is on the DOM (css set to 100%)
		let canvas = this.myCanvas.nativeElement;
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;

		this.resizeSensor = new ResizeSensor(canvas, () => {
			let diffWidth = canvas.offsetWidth - canvas.width;
			let diffHeight = canvas.offsetHeight - canvas.height;

			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;

			this.canvas.setWidth(canvas.width);
			this.canvas.setHeight(canvas.height);

			let vpt = this.canvas.viewportTransform;
			vpt[4] += diffWidth / 2;
			vpt[5] += diffHeight / 2;
		});

		fabric.Object.prototype.borderColor = 'LimeGreen';
		fabric.Object.prototype.cornerColor = 'black';
		fabric.Object.prototype.borderScaleFactor = 2;
		fabric.Object.prototype.borderDashArray = [5, 5];
		this.canvas = new fabric.Canvas(canvas, {
			fireRightClick: true,
			renderOnAddRemove: false,
		});

		// Disable context menu
		// TODO: do this more intelligently. Without waiting a second, it only finds the upper-canvas in the project editor
		setTimeout(() => {
			(document.getElementsByClassName('upper-canvas')[0] as HTMLElement).addEventListener('contextmenu', (e) => {
				e.preventDefault();
			});
		}, 1000);

		fabric.Image.fromURL(this.asset.url, img => {
			this.assetImg = img;

			let zoom = Math.min(canvas.width / img.width, canvas.height / img.height);
			this.canvas.setZoom(zoom);

			let vpt = this.canvas.viewportTransform;
			vpt[4] = canvas.width / 2;
			vpt[5] = canvas.height / 2;

			this.addGroupToCanvas();
		}, {
			originX: "center",
			originY: "center",
			selectable: false,
			top: 0,
			left: 0,
		});

		let initialVpt = this.canvas.viewportTransform;
		initialVpt[4] = this.canvas.width / 2;
		initialVpt[5] = this.canvas.height / 2;
		console.log("Initial viewport: ", this.canvas.viewportTransform);

		this.canvas.on('selection:cleared', opt => {
			this.selectRegion = null;
		});

		this.canvas.on('mouse:wheel', opt => {
			let e = (opt.e as WheelEvent);
			let delta = e.deltaY;

			let { maxZoom, zoomSpeed } = environment.editor.workspace;
			let assetWidth = this.assetImg.width;
			let assetHeight = this.assetImg.height;
			let minZoom = Math.min(canvas.width / assetWidth, canvas.height / assetHeight);

			let zoom = Math.min(Math.max((1 - zoomSpeed) ** delta * this.canvas.getZoom(), minZoom), maxZoom);
			e.preventDefault();
			e.stopPropagation();

			this.canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom);

			let vpt = this.canvas.viewportTransform;
			if (zoom <= canvas.width / assetWidth) {
				vpt[4] = Math.min(Math.max(vpt[4], assetWidth * zoom / 2), canvas.width - assetWidth * zoom / 2);
			} else {
				vpt[4] = Math.min(Math.max(vpt[4], -assetWidth * zoom / 2 + canvas.width), assetWidth * zoom / 2);
			}
			if (zoom <= canvas.height / assetHeight) {
				vpt[5] = Math.min(Math.max(vpt[5], assetHeight * zoom / 2), canvas.height - assetHeight * zoom / 2);
			} else {
				vpt[5] = Math.min(Math.max(vpt[5], -assetHeight * zoom / 2 + canvas.height), assetHeight * zoom / 2);
			}

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
				let assetWidth = this.assetImg.width;
				let assetHeight = this.assetImg.height;
				let zoom = this.canvas.getZoom();

				let vpt = this.canvas.viewportTransform;
				vpt[4] += e.movementX;
				vpt[5] += e.movementY;
				if (zoom <= canvas.width / assetWidth) {
					vpt[4] = Math.min(Math.max(vpt[4], assetWidth * zoom / 2), canvas.width - assetWidth * zoom / 2);
				} else {
					vpt[4] = Math.min(Math.max(vpt[4], -assetWidth * zoom / 2 + canvas.width), assetWidth * zoom / 2);
				}
				if (zoom <= canvas.height / assetHeight) {
					vpt[5] = Math.min(Math.max(vpt[5], assetHeight * zoom / 2), canvas.height - assetHeight * zoom / 2);
				} else {
					vpt[5] = Math.min(Math.max(vpt[5], -assetHeight * zoom / 2 + canvas.height), assetHeight * zoom / 2);
				}

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
		});
	}

	addGroupToCanvas() {
		this.canvas.clear();
		this.drawables = [];
		this.canvas.add(this.assetImg);
		this.group.regions.forEach(region => this.addRegionToCanvas(region));
		this.canvas.requestRenderAll();
	}

	addRegionToCanvas(region: Region) {
		let shape: fabric.Rect | fabric.Circle;
		const globalOptions: fabric.IRectOptions = {
			fill: (this.group.color ?? environment.editor.regions.defaultRegionGroupColor) + environment.editor.regions.regionFillTransparency,
			stroke: (this.group.color ?? environment.editor.regions.defaultRegionGroupColor),
			strokeWidth: 10,
			strokeDashArray: [20, 20],
			originX: 'center',
			originY: 'center',
		};
		if (region.shape == 'Square') {
			shape = new fabric.Rect({
				width: .1 * this.assetImg.width,
				height: .1 * this.assetImg.height,
				...region.params.nonpoly,
				...globalOptions,
			});
		} else if (region.shape == 'Circle') {
			shape = new fabric.Circle({
				radius: .05 * (this.assetImg.width + this.assetImg.height),
				...region.params.nonpoly,
				...globalOptions,
			})
		}

		let drawable: DrawableRegion = {
			region,
			img: shape,
		};

		this.drawables.push(drawable);

		shape.on('selected', e => {
			this.selectedRegion = drawable;
		});

		shape.on('modified', e => {
			if (region.shape != 'Polygon') {
				region.params.nonpoly = {
					top: shape.top,
					left: shape.left,
					scaleX: shape.scaleX,
					scaleY: shape.scaleY,
					angle: shape.angle,
				}
			}

			this.dirty.emit();
		});

		this.canvas.add(shape);
	}

	newRegion() {
		let newRegion: Region = {
			shape: this.newRegionType,
			params: {
				nonpoly: {
					top: 0,
					left: 0,
					scaleX: 1,
					scaleY: 1,
					angle: 0,
				},
				points: [],
			}
		};
		this.group.regions.push(newRegion);
		this.addRegionToCanvas(newRegion);
		this.canvas.requestRenderAll();
		this.dirty.emit();

		console.log("Added new region: ", this.group.regions, ", ", this.asset);
	}

	selectRegion(selectionChange: MatSelectionListChange) {
		console.log('Selected: ', selectionChange.source.selectedOptions.selected[0]?.value);
		this.canvas.setActiveObject(selectionChange.source.selectedOptions.selected[0]?.value.img);
		this.canvas.requestRenderAll();
	}
}
