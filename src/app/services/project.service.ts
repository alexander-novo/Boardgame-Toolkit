import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FileInput } from 'ngx-material-file-input';
import { RegisterService } from './register.service';

export interface Asset {
	_id: string;
	name: string;
	url: string;
	size: number;
	position?: {
		x: number;
		y: number;
	};
	scale?: {
		x: number;
		y: number;
	};
	angle: number;
	assetCollection?: number;
}

export interface Tag{
	_id: string;
	name: string;
	//dataNumber: number;
	//dataString: string;
}

export interface AssetCollection {
	_id: string;
	name: string;
	assets: number[];
	url?: string;
	position?: {
		x: number;
		y: number;
	};
	scale?: {
		x: number;
		y: number;
	};
	angle: number;
}

export class Project {
	_id: string;
	__v: number;
	name: string;
	owner: string;
	date: {
		created: Date;
		modified: Date;
	};
	thumbnail?: string;
	assets: Asset[];
	projectTags: Tag[];
	assetCollections: AssetCollection[];
	camera: {
		x: number;
		y: number;
		zoom: number;
	};
}

export interface ProjectThumbnail {
	id: string;
	name: string;
	modified: Date;
	thumbnail: string;
}

@Injectable({
	providedIn: 'root'
})
export class ProjectService {

	constructor(private registerService: RegisterService, private http: HttpClient) { }

	// Service for getting a specific project.
	// Must be logged in.
	getProject(id: string) {
		const params = new HttpParams().set("id", id);
		return this.http.get<Project>('/api/projects/project', { params });
	}

	saveProject(id: string, project: Project) {
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

	addThumbnailToCollection(projectId: string, collectionIndex: number, thumbnailFile: FileInput) {
		return this.http.put<string>('/api/projects/collection/thumbnail', { id: projectId, collectionIndex, size: thumbnailFile.files[0]?.size, type: thumbnailFile.files[0]?.type });
	}
}
