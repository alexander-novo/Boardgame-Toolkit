import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';

interface AssetNode{
	name: string;
	children?: AssetNode[];
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
		this.project.assets.forEach(asset=>Assets.children.push({
			name: asset.name,
		})); 
		this.dataSource.data = [Assets];
	}

	hasChild = (_: number, node: AssetNode) => !!node.children && node.children.length > 0;
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