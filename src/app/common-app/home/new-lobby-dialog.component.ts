import { Component, Inject } from "@angular/core";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export class NewLobbyDialogData {
	projectName: string;
}

@Component({
	selector: 'new-lobby-dialog',
	templateUrl: 'new-lobby-dialog.component.html',
	styleUrls: ['new-lobby-dialog.component.scss']
})
export class NewLobbyDialogComponent {
	lobbyForm: FormGroup;

	constructor(
		public dialogRef: MatDialogRef<NewLobbyDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public data: NewLobbyDialogData,
		formBuilder: FormBuilder) {
		this.lobbyForm = formBuilder.group({
			name: ['', Validators.required],
			maxPlayers: [4, [Validators.required, Validators.min(1)]],
			pub: [true],
		});
	}

	onNoClick(): void {
		this.dialogRef.close();
	}

	onOkClick(): void {
		this.dialogRef.close(this.lobbyForm.value);
	}

}