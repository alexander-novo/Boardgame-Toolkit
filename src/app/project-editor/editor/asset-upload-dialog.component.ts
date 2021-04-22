import { Component, Inject, ViewChild } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AssetCollection } from "src/app/services/project.service";
import { environment } from "src/environments/environment";
import { NgxDropzoneChangeEvent } from 'ngx-dropzone';
import { RejectedFile } from 'ngx-dropzone/lib/ngx-dropzone.service';
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatSelectionList } from "@angular/material/list";

export class AssetUploadDialogData {
	collections: { collection: AssetCollection, index: number }[];
}

@Component({
	selector: 'asset-upload-dialog',
	templateUrl: 'asset-upload-dialog.component.html',
	styleUrls: ['asset-upload-dialog.component.scss'],
})
export class AssetUploadDialogComponent {
	files: File[] = [];
	environment = environment;

	@ViewChild('collectionList')
	collectionList: MatSelectionList;

	constructor(
		public dialogRef: MatDialogRef<AssetUploadDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: AssetUploadDialogData,
		private snackBar: MatSnackBar) { }

	onFileAdd(event: NgxDropzoneChangeEvent): void {
		this.files.push(...event.addedFiles);

		let rejectedType = event.rejectedFiles.filter((file: RejectedFile) => file.reason == 'type');
		let rejectedSize = event.rejectedFiles.filter((file: RejectedFile) => file.reason == 'size');

		if (rejectedType.length > 0) {
			let snackbarRef = this.snackBar.open(
				`File '${rejectedType[0].name}' ${rejectedType.length > 1 ? `and ${rejectedType.length - 1} other${rejectedType.length > 2 ? 's' : ''} are` : 'is'} not ${rejectedType.length == 1 ? 'an image' : 'images'}.`,
				undefined,
				{ duration: 3000, }
			);

			if (rejectedSize.length > 0) {
				snackbarRef.afterDismissed().subscribe(() => {
					this.snackBar.open(
						`File '${rejectedSize[0].name}' ${rejectedSize.length > 1 ? `and ${rejectedSize.length - 1} other${rejectedSize.length > 2 ? 's' : ''} are` : 'is'} too large.`,
						undefined,
						{ duration: 3000, }
					);
				});
			}
		} else if (rejectedSize.length > 0) {
			this.snackBar.open(
				`File '${rejectedSize[0].name}' ${rejectedSize.length > 1 ? `and ${rejectedSize.length - 1} other${rejectedSize.length > 2 ? 's' : ''} are` : 'is'} too large.`,
				undefined,
				{ duration: 3000, }
			)
		}
	}

	onRemove(file: File) {
		this.files.splice(this.files.indexOf(file), 1);
	}

	onNoClick(): void {
		this.dialogRef.close();
	}

	onOkClick(): void {
		let collection = this.collectionList.selectedOptions.selected[0]?.value;
		this.dialogRef.close({
			files: this.files,
			collection,
		});
	}

}
