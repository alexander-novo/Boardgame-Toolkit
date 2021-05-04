import { Color, stringInputToObject } from '@angular-material-components/color-picker';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { MatSelectionList, MatSelectionListChange } from '@angular/material/list';
import { MatSidenav } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ResizeSensor } from 'css-element-queries';
import { fabric } from "fabric";
import { environment } from 'src/environments/environment';
import { Asset, Edge, Region, RegionGroup } from '../../services/project.service';

interface DrawableRegion {
	region: Region;
	regionIndex: number;
	img: fabric.Object;
	edges: fabric.Object[];
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
	@ViewChild('rightNav')
	rightNav: MatSidenav;
	@ViewChild('regionList')
	regionList: MatSelectionList;

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
	selectedRegionEdges: Edge[][];
	copiedRegion: DrawableRegion;
	drawables: DrawableRegion[] = [];
	addEdgeToMapIndex: number;
	newEdgeMode: boolean = false;
	lineArrow: any;
	currentlyDrawingArrow: any;
	selectNewRegionAfterAddingEdge = true;
	didDragCanvas = false;
	lastCanvasMouseMoveEvent: Event;

	// TODO: look into destroying this
	private resizeSensor: ResizeSensor;

	constructor(private snackBar: MatSnackBar) { }

	// Initialization of components
	ngAfterViewInit(): void {
		// Make canvas pixel size the same as it actually is on the DOM (css set to 100%)
		let canvas = this.myCanvas.nativeElement;
		canvas.width = canvas.offsetWidth;
		canvas.height = canvas.offsetHeight;

		// Needed because the canvas resizes as the tab is switched
		this.resizeSensor = new ResizeSensor(canvas, () => {
			let diffWidth = canvas.offsetWidth - canvas.width;
			let diffHeight = canvas.offsetHeight - canvas.height;

			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;

			this.canvas.setWidth(canvas.width);
			this.canvas.setHeight(canvas.height);

			// Leave the camera looking at the same spot and expand it equally in both directions
			let vpt = this.canvas.viewportTransform;
			vpt[4] += diffWidth / 2;
			vpt[5] += diffHeight / 2;
		});

		// Set defaults
		fabric.Object.prototype.borderColor = 'LimeGreen';
		fabric.Object.prototype.cornerColor = 'black';
		fabric.Object.prototype.borderScaleFactor = 2;
		fabric.Object.prototype.borderDashArray = [5, 5];
		// Take from https://www.thirdrocktechkno.com/blog/draw-an-arrow-using-html-5-canvas-and-fabricjs/
		this.lineArrow ??= fabric.util.createClass(fabric.Line, {

			type: 'lineArrow',

			initialize: function (element, options) {
				options || (options = {});
				this.callSuper('initialize', element, options);
			},

			toObject: function () {
				return fabric.util.object.extend(this.callSuper('toObject'), undefined);
			},

			_render: function (ctx) {
				this.callSuper('_render', ctx);

				// do not render if width/height are zeros or object is not visible
				// if (this.width === 0 || this.height === 0 || !this.visible) return;
				if (!this.visible) return;

				ctx.save();

				var xDiff = this.x2 - this.x1;
				var yDiff = this.y2 - this.y1;
				var angle = Math.atan2(yDiff, xDiff);
				ctx.translate((this.x2 - this.x1) / 2, (this.y2 - this.y1) / 2);
				ctx.rotate(angle);
				ctx.beginPath();
				//move 10px in front of line to start the arrow so it does not have the square line end showing in front (0,0)
				ctx.moveTo(10, 0);
				ctx.lineTo(-20, 15);
				ctx.lineTo(-20, -15);
				ctx.closePath();
				ctx.fillStyle = this.stroke;
				ctx.fill();

				ctx.restore();

			}
		});

		// We need fireRightClick for right click panning
		// renderOnAddRemove set to false for performance
		this.canvas = new fabric.Canvas(canvas, {
			fireRightClick: true,
			renderOnAddRemove: false,
			stopContextMenu: true, // <--  prevent context menu from showing
		});

		// Load the asset that this region group is for
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

		this.canvas.on('selection:cleared', opt => {
			if (this.newEdgeMode) {
				this.canvas.setActiveObject(this.selectedRegion.img);
			} else {
				this.selectedRegion = null;
				this.selectedRegionEdges = [];
				this.rightNav.close();
				this.regionList.selectedOptions.clear();
			}
		});

		// Zoom using mouse wheel
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

			// ZoomToPoint used to allow people to zoom into other points besides center of screen
			this.canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom);

			// Set good bounds based on how far we are zoomed out
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
				this.didDragCanvas = false;
				this.canvas.selection = false;

				this.canvas.setCursor('grabbing');

				e.preventDefault();
			}
		});

		// Pan using right click
		this.canvas.on('mouse:move', opt => {
			let e = (opt.e as MouseEvent);

			if (this.isDraggingCanvas) {
				let assetWidth = this.assetImg.width;
				let assetHeight = this.assetImg.height;
				let zoom = this.canvas.getZoom();

				let vpt = this.canvas.viewportTransform;
				vpt[4] += e.movementX;
				vpt[5] += e.movementY;
				// Same bounds as above
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

				this.didDragCanvas = true;
			}

			if (this.newEdgeMode) {
				let pointer = this.canvas.getPointer(e);
				this.currentlyDrawingArrow.set({
					x2: pointer.x,
					y2: pointer.y,
				});
				this.currentlyDrawingArrow.setCoords();
				this.canvas.requestRenderAll();

				this.lastCanvasMouseMoveEvent = e;
			}
		});

		this.canvas.on('mouse:up', opt => {

			if (this.isDraggingCanvas && !this.didDragCanvas) {
				this.canvas.remove(this.currentlyDrawingArrow);
				this.currentlyDrawingArrow = null;
				this.newEdgeMode = false;
				this.didDragCanvas = false;
				this.drawables.forEach(drawable => drawable.img.selectable = true);
				this.canvas.requestRenderAll();
			}
			this.isDraggingCanvas = false;
			this.canvas.selection = true;

			this.canvas.setCursor('default');

			opt.e.preventDefault();
		});
	}

	// Refresh the entire canvas and start over by adding the entire
	// group as it exists in the project to the canvas.
	addGroupToCanvas() {
		this.canvas.clear();
		this.drawables = [];
		this.canvas.add(this.assetImg);
		this.group.regions.forEach((region, regionIndex) => this.addRegionToCanvas(region, regionIndex));
		this.group.regions.forEach((region, regionIndex) => this.addEdgesToCanvas(region, regionIndex))
		this.canvas.requestRenderAll();
	}

	// Called from a variety of places, such as adding a new region or loading all regions initially.
	addRegionToCanvas(region: Region, regionIndex: number) {
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
			regionIndex,
			img: shape,
			edges: [],
		};

		this.drawables.push(drawable);

		shape.on('selected', e => {
			if (this.selectedRegion == drawable) return;

			this.selectedRegion = drawable;
			this.selectedRegionEdges = (this.selectedRegion.region.edges as any[]).reduce((acc, cur) => { console.log("acc: ", acc, " cur: ", cur); acc[cur.map].push(cur); return acc; }, new Array(this.group.maps.length).fill([]));
			this.regionList.selectedOptions.clear();
			this.regionList.selectedOptions.select(this.regionList.options.find(option => option.value == this.selectedRegion));
			this.rightNav.open();
		});

		shape.on('mousedown', e => {
			// Left Click
			if (this.newEdgeMode && e.button === 1) {
				this.currentlyDrawingArrow.set({
					x2: shape.left,
					y2: shape.top,
				});
				this.currentlyDrawingArrow.setCoords();

				this.selectedRegion.edges.push(this.currentlyDrawingArrow);

				this.selectedRegion.region.edges.push({
					map: this.addEdgeToMapIndex,
					destination: regionIndex,
				});

				if (this.selectNewRegionAfterAddingEdge) {
					this.canvas.setActiveObject(shape);
				}

				let pointer = this.canvas.getPointer(this.lastCanvasMouseMoveEvent);
				let map = this.group.maps[this.addEdgeToMapIndex];
				this.currentlyDrawingArrow = new this.lineArrow([this.selectedRegion.img.left, this.selectedRegion.img.top, pointer.x, pointer.y], {
					originX: 'center',
					originY: 'center',
					selectable: false,
					hasBorders: false,
					hasControls: false,
					fill: map.color ?? this.group.color ?? environment.editor.regions.defaultRegionGroupColor,
					stroke: map.color ?? this.group.color ?? environment.editor.regions.defaultRegionGroupColor,
					strokeWidth: 5,
					evented: false,
				});
				this.canvas.add(this.currentlyDrawingArrow);
				this.canvas.requestRenderAll();
				this.dirty.emit();
			}
		})

		// Modified when changes are finished i.e. user unclicks.
		// TODO: need to change for poly eventually.
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

		return shape;
	}

	addEdgesToCanvas(region: Region, regionIndex: number) {
		region.edges.forEach(edge => {
			let map = this.group.maps[edge.map];
			let destination = this.drawables[edge.destination];
			let edgeArrow = new this.lineArrow([this.drawables[regionIndex].img.left, this.drawables[regionIndex].img.top, destination.img.left, destination.img.top], {
				originX: 'center',
				originY: 'center',
				selectable: false,
				hasBorders: false,
				hasControls: false,
				fill: map.color ?? this.group.color ?? environment.editor.regions.defaultRegionGroupColor,
				stroke: map.color ?? this.group.color ?? environment.editor.regions.defaultRegionGroupColor,
				strokeWidth: 5,
				evented: false,
			});

			this.drawables[regionIndex].edges.push(edgeArrow);
			this.canvas.add(edgeArrow);
			this.canvas.requestRenderAll();
		})
	}

	// Called when new region button is clicked.
	newRegion() {
		let newRegion: Region = {
			shape: this.newRegionType,
			edges: [],
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
		this.addRegionToCanvas(newRegion, this.group.regions.length - 1);
		this.canvas.requestRenderAll();
		this.dirty.emit();
	}

	// Called from the list of regions on the left navbar.
	// Actual selection code is handled in an 'object:selected' event handler in addRegionToCanvas().
	selectRegion(selectionChange: MatSelectionListChange) {
		// We'll call that code by setting the active object.
		this.canvas.setActiveObject(selectionChange.source.selectedOptions.selected[0]?.value.img);
		this.canvas.requestRenderAll();
	}

	selectRegionIndex(regionIndex: number) {
		this.canvas.setActiveObject(this.drawables.find(drawable => drawable.regionIndex == regionIndex).img);
		this.canvas.requestRenderAll();
	}

	// Keydown listener for copy/paste support.
	@HostListener('window:keydown', ['$event'])
	onKeyDown(e: KeyboardEvent) {
		if (e.ctrlKey && e.key == 'c' && this.selectedRegion) {
			this.copiedRegion = this.selectedRegion;
			this.snackBar.open('Region \'' + (this.selectedRegion.region.name || 'New Region' + '\' Copied!'), null, {
				duration: 2000,
			});
		} else if (e.ctrlKey && e.key == 'v' && this.copiedRegion) {
			// God javascript is awful. The best way to deep copy is to stringify as json and parse.
			// 🤮
			// Need to deep copy, otherwise changing the params of the new region will change the params of the old one.
			let newRegion: Region = JSON.parse(JSON.stringify(this.copiedRegion.region));
			newRegion.name = (newRegion.name ?? 'New Region') + ' (Copy)';
			this.group.regions.push(newRegion);
			const newObject = this.addRegionToCanvas(newRegion, this.group.regions.length - 1);
			this.canvas.setActiveObject(newObject);
			this.canvas.requestRenderAll();
			this.dirty.emit();
		}
	}

	newMap(): void {
		this.group.maps.push({
			visible: true,
		});
		this.dirty.emit();
	}

	changeMapName(mapIndex: number): void {
		let map = this.group.maps[mapIndex];
		// TODO: popup
		this.dirty.emit();
	}

	changeMapColor(mapIndex: number): void {
		let map = this.group.maps[mapIndex];
		// TODO: loop through all edges on the canvas and change their colors
		this.dirty.emit();
	}

	toggleMapVisibility(mapIndex: number): void {
		let map = this.group.maps[mapIndex];
		map.visible = !map.visible;
		// TODO: loop through all edges on the canvas and change visibility
		this.dirty.emit();
	}

	deleteMap(mapIndex: number): void {
		// TODO: remove all edges on the canvas associated with this group
		this.group.maps.splice(mapIndex, 1);
		this.dirty.emit();
	}

	startNewEdge(mapIndex: number): void {
		let map = this.group.maps[mapIndex];
		this.newEdgeMode = true;
		this.drawables.forEach(drawable => drawable.img.selectable = false);
		this.canvas.selection = false;
		this.currentlyDrawingArrow = new this.lineArrow([this.selectedRegion.img.left, this.selectedRegion.img.top, this.selectedRegion.img.left, this.selectedRegion.img.top], {
			originX: 'center',
			originY: 'center',
			selectable: false,
			hasBorders: false,
			hasControls: false,
			fill: map.color ?? this.group.color ?? environment.editor.regions.defaultRegionGroupColor,
			stroke: map.color ?? this.group.color ?? environment.editor.regions.defaultRegionGroupColor,
			strokeWidth: 5,
			evented: false,
		});
		this.canvas.add(this.currentlyDrawingArrow);
		this.canvas.requestRenderAll();
	}
}
