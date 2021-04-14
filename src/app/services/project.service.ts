import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FileInput } from 'ngx-material-file-input';
import { RegisterService } from './register.service';

@Injectable({
	providedIn: 'root'
})
export class ProjectService {

	constructor(private registerService: RegisterService, private http: HttpClient) { }

	// Service for getting a specific project.
	// Must be logged in.
	getProject(id: string) {
		const params = new HttpParams().set("id", id);
		return this.http.get<any>('/api/projects/project', { params });
	}

	saveProject(id: string, project: any) {
		const params = new HttpParams().set("id", id);
		
		return this.http.put<void>('/api/projects/project', project, { params });
	}

	// Service for creating new project.
	// Must be logged in.
	createNewProject(name: string, hasThumbnail: boolean, thumbnailFile: FileInput) {
		let thumbnailDeats = hasThumbnail ? { name: thumbnailFile.files[0]?.name, size: thumbnailFile.files[0]?.size, type: thumbnailFile.files[0]?.type } : undefined;
		return this.http.put<{ id: string, signedUrl?: string }>('/api/projects/new', { name, hasThumbnail, thumbnailDeats });
	}

	// Service for uploading assets to an amazon url after retreiving the url
	uploadAsset(url: string, file: File) {
		return this.http.put<any>(url, file);
	}

	// Service for adding new assets to a project.
	// Must be logged in. Returns a list of URLs to upload the files to using uploadAsset()
	createNewAssets(id: string, assets: File[]) {
		const assetDeats = assets.map(function (asset: File) { return { name: asset.name, size: asset.size, type: asset.type } });

		return this.http.put<string[]>('/api/projects/assets/new', { id, assetDeats });
	}
}
