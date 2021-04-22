import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Asset, Project, ProjectService } from 'src/app/services/project.service';

@Component({
	selector: 'app-workspace',
	templateUrl: './workspace.component.html',
	styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {

	project: Project;
	projectId: string;

	constructor(
		private route: ActivatedRoute,
		private projectService: ProjectService,
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.projectId = window.decodeURIComponent(params['id']);

			this.refreshProject();
		});
	}

	refreshProject(callback?: (param: { oldProject: Project, newAssets: { asset: Asset, index: number }[] }) => void) {
		let obs = this.projectService.getProject(this.projectId).pipe(
			map(project => {
				let oldProject = this.project;
				this.project = project;

				console.log(this.project);

				let newAssets = oldProject === undefined ?
					undefined :
					project.assets
						.map((asset, index) => ({ asset, index }))
						.filter(({ asset, index }) => !oldProject.assets.some(oldAsset => oldAsset._id == asset._id));

				return { oldProject, newAssets };
			}, this),
		);

		// let subj = new Subject<{ oldProject: Project, newAssets: { asset: Asset, index: number }[] }>();
		// obs.subscribe(subj);

		obs.subscribe(
			obj => callback?.(obj),
			err => console.error(err)
		)
	}
}
