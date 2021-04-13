import { Component, OnInit } from '@angular/core';
import { RegisterService } from '../../services/register.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

	THUMBNAIL_NOT_FOUND: string = "https://boardgame-toolkit-assets.s3-us-west-1.amazonaws.com/image-not-found.png";

	projects: { id: string, name: string, modified: Date, thumbnail?: string }[] = [];

	constructor(private registerService: RegisterService) { }

	ngOnInit(): void {
		// Get list of projects
		this.registerService.getMyProjects().subscribe(
			proj => {
				//for (var project of proj) {
				//	this.projects.push({ name: project.name, modified: project.modified, thmubnail: })

				//	}
				this.projects = proj;
			}
		)
	}

}
