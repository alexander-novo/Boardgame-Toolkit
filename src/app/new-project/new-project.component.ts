import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService, uniqueUsernameValidator } from '../register.service';

@Component({
	selector: 'app-new-project',
	templateUrl: './new-project.component.html',
	styleUrls: ['./new-project.component.scss']
})
export class NewProjectComponent implements OnInit {
	newProjForm = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(4)]),
	});

	constructor(private registerService: RegisterService, private router: Router) { }

	ngOnInit(): void {
	}

	onSubmit(): void {
		this.registerService.createNewProject(this.projName.value).subscribe(
			x => { },
			err => console.log(err),
			() => this.router.navigateByUrl('/')
		);
	}

	get projName() { return this.newProjForm.get("name"); }
}
