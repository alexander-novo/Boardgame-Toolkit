import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register.service';
import { FileValidator, FileInput } from 'ngx-material-file-input';
import { ProjectService } from 'src/app/services/project.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-new-project',
	templateUrl: './new-project.component.html',
	styleUrls: ['./new-project.component.scss']
})
export class NewProjectComponent implements OnInit {
	newProjForm = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(4)]),
		thumbnailFile: new FormControl('', [FileValidator.maxContentSize(environment.maxAssetSize)]),
	});

	constructor(private registerService: RegisterService, private projectService: ProjectService, private router: Router) { }

	ngOnInit(): void {
	}

	onSubmit(): void {
		const validThumbnail: boolean = this.thumbnailFile.valid && this.thumbnailFile.value != null && this.thumbnailFile.value.files !== undefined;
		const thumbnailFile: FileInput = this.thumbnailFile.value;
		var uploadingUrl: boolean = validThumbnail;
		this.projectService.createNewProject(this.projName.value, validThumbnail, thumbnailFile).subscribe(
			res => {
				uploadingUrl &&= res.signedUrl !== undefined;

				if (uploadingUrl) {
					console.log(`Uploading to ${res.signedUrl}`);
					console.log(thumbnailFile);
					this.projectService.uploadAsset(res.signedUrl, thumbnailFile.files[0]).subscribe(
						res => console.log(res),
						err => console.log(err),
						() => {
							console.log("Received response from thumbnail upload - redirecting");
							this.router.navigateByUrl('/');
						}
					);
				}
			},
			err => console.log(err),
			() => {
				if (!uploadingUrl) this.router.navigateByUrl('/');
				else console.log("Not redirecting - uploading thumbnail");
			}
		);
	}

	get projName() { return this.newProjForm.get("name"); }
	get thumbnailFile() { return this.newProjForm.get("thumbnailFile"); }
}
