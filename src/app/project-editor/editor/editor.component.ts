import { Component, Inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { MatRipple } from '@angular/material/core';

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

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

	projectId: string;
	project: any;
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
			},
			err => {
				console.error(err);
			},
			() => { }
		);
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