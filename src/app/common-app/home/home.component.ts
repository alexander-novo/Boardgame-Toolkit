import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LobbyService } from 'src/app/services/lobby.service';
import { ProjectService, ProjectThumbnail } from 'src/app/services/project.service';
import { RegisterService } from '../../services/register.service';
import { NewLobbyDialogComponent } from './new-lobby-dialog.component';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

	THUMBNAIL_NOT_FOUND: string = "https://boardgame-toolkit-assets.s3-us-west-1.amazonaws.com/image-not-found.png";

	projects: ProjectThumbnail[] = [];
	publicProjects: ProjectThumbnail[] = [];

	constructor(private registerService: RegisterService, private projectService: ProjectService, private lobbyService: LobbyService, public router: Router, private dialog: MatDialog) { }

	ngOnInit(): void {
		// Get list of projects
		this.registerService.getMyProjects().subscribe(
			proj => {
				this.projects = proj;

				if (this.publicProjects)
					this.publicProjects = this.publicProjects.filter(pubProj => !this.projects.some(localProj => localProj.id == pubProj.id));
			}


		);

		this.projectService.getPublicProjects().subscribe(
			proj => {
				this.publicProjects = proj;

				if (this.projects)
					this.publicProjects = this.publicProjects.filter(pubProj => !this.projects.some(localProj => localProj.id == pubProj.id));
			}


		)
	}

	newLobby(project: ProjectThumbnail) {
		const dialogRef = this.dialog.open(NewLobbyDialogComponent, {
			width: '450px',
			data: {
				projectName: project.name,
			}
		});

		dialogRef.afterClosed().subscribe(re => {
			if (re !== undefined) {
				let { name, maxPlayers, pub } = re;

				this.lobbyService.newLobby({
					name,
					maxPlayers,
					public: pub,
					projectId: project.id,
				}).subscribe(re => this.lobbyService.joinLobby(re));
			}
		});
	}

}
