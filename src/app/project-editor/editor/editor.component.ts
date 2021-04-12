import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';

@Component({
	selector: 'app-editor',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

	projectId: string;
	project: any;
	
	constructor(
		private route: ActivatedRoute,
		private projectService: ProjectService
	) { }

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
				this.draw()
				
			},
			err => {
				console.error(err);
			},
			() => { }
		);
	}
	

@ViewChild('myCanvas', {static: false}) myCanvas: ElementRef<HTMLCanvasElement>;

  context: CanvasRenderingContext2D;
  
  ngAfterViewInit(): void {
    this.context = (this.myCanvas.nativeElement as HTMLCanvasElement).getContext('2d');
	}
	
	//draws all assets uploaded.
    private draw() {
		const assets = this.project.assets[0];
		//set scale for canvas images to half thier size
		this.context.scale(.5,.5);
		for(const asset of this.project.assets){
			this.drawAsset(asset)
		}
	}

  	private drawAsset(assets){
		const img = new Image()

		//impliment x and y positions later
		/*if(assets.position.x == null){
		assets.position.x = 0;
		}
		if(assets.position.y == null){
		assets.position.y = 0;
		}*/
		let context = this.context;
		img.onload = ()=> {
		context.drawImage(img,0,0)
		}
		img.src = assets.url
		console.log(img);
	}
}


