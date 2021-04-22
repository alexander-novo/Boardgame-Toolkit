import { Component, ViewChild, Inject } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSelectionList } from "@angular/material/list";
import { FileValidator } from "ngx-material-file-input";
import { Asset } from "src/app/services/project.service";
import { environment } from "src/environments/environment";

export interface CollectionDialogData {
	assets: Array<{ asset: Asset, index: number }>;
	defaultSelection: number[];
}

@Component({
	selector: 'collection-dialog',
	templateUrl: 'collection-dialog.component.html',
})
export class CollectionDialogComponent {
	@ViewChild('collectionList') collectionList: MatSelectionList;
	newCollectionForm = new FormGroup({
		name: new FormControl('', [Validators.required, Validators.minLength(4)]),
		backFile: new FormControl('', [FileValidator.maxContentSize(environment.maxAssetSize)]),
	});
	name: string;

	constructor(
		public dialogRef: MatDialogRef<CollectionDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: CollectionDialogData) { }

	onNoClick(): void {
		this.dialogRef.close();
	}

	onOkClick(): void {
		this.dialogRef.close({
			newCollection: {
				name: this.newCollectionForm.get('name').value,
				assets: this.collectionList.selectedOptions.selected.map(option => option.value),
			},
			file: this.newCollectionForm.get('backFile').value
		});
	}

}
