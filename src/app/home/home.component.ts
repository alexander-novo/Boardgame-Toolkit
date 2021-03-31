import { Component, OnInit } from '@angular/core';
import { RegisterService } from '../register.service';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

	projects: { name: string, modified: Date, thumbnail?: string }[] = [];

	constructor(private registerService: RegisterService) { }

	ngOnInit(): void {
		// Get list of projects
		this.registerService.getMyProjects().subscribe(
			proj => {
				for (var project of proj) {
					this.projects.push({ name: project.name, modified: project.modified })
				}
			}
		)
	}

}
