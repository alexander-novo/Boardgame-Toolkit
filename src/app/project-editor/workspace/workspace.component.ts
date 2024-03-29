import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { Asset, Project, ProjectService } from 'src/app/services/project.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-workspace',
	templateUrl: './workspace.component.html',
	styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit {

	project: Project;
	projectId: string;
	dirty = false;
	editorOptions = { theme: 'vs-dark', language: 'typescript' };
	code = "// TODO";

	editingRegionGroup?: { asset: Asset, index: number } = undefined;
	finishedEditingRegionGroupCallback?: () => void;

	private autosave: number;

	constructor(
		private route: ActivatedRoute,
		private projectService: ProjectService,
		private snackBar: MatSnackBar
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.projectId = window.decodeURIComponent(params['id']);

			this.refreshProject();
		});
	}

	refreshProject(callback?: (param: { project: Project, oldProject: Project, newAssets: { asset: Asset, index: number }[] }) => void) {
		if (this.autosave) {
			clearInterval(this.autosave);
			this.autosave = null;
		}

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

				return { project, oldProject, newAssets };
			}, this),
		);

		obs.subscribe(
			obj => {
				this.dirty = false;

				// Auto save every 5 seconds if the project is dirty
				this.autosave = window.setInterval(() => {
					if (this.dirty) {
						this.projectService.saveProject(this.projectId, this.project).subscribe(
							() => { this.snackBar.open("Project Saved", undefined, { duration: environment.editor.autoSaveBarDuration }); }
						);
						this.project.__v++;
						this.dirty = false;
					}
				}, environment.editor.autoSaveInterval);

				callback?.(obj);
			},
			err => console.error(err)
		)
	}

	tabChange(e: MatTabChangeEvent): void {
		if (e.index == 0 && this.editingRegionGroup) {
			if (this.finishedEditingRegionGroupCallback) {
				this.finishedEditingRegionGroupCallback();
			}

			this.editingRegionGroup = this.finishedEditingRegionGroupCallback = null;
		}
	}
}
