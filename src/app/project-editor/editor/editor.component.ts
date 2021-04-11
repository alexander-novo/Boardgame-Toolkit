import { Component, OnInit } from '@angular/core';
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
		private projectService: ProjectService
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

					this.refreshProject();
				})
			},
			err => console.error(err),
			() => { }
		)
	}

	refreshProject(): void {
		this.projectService.getProject(this.projectId).subscribe(
			project => {
				this.project = project;
				console.log(this.project);
			},
			err => {
				console.error(err);
			},
			() => { }
		);
	}

	hasChild = (_: number, node: AssetNode) => !!node.children && node.children.length > 0;
}
