import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectionList } from '@angular/material/list';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxDropzoneChangeEvent } from 'ngx-dropzone';
import { RejectedFile } from 'ngx-dropzone/lib/ngx-dropzone.service';
import { Lobby, LobbyService } from 'src/app/services/lobby.service';
import { AssetCollection } from 'src/app/services/project.service';
import { environment } from 'src/environments/environment';

@Component({
	selector: 'app-lobby-list',
	templateUrl: './lobby-list.component.html',
	styleUrls: ['./lobby-list.component.scss']
})
export class LobbyListComponent implements AfterViewInit, OnInit {
	displayedColumns: string[] = ['owner', 'name', 'gameName', 'players'];
	dataSource = new MatTableDataSource<Lobby>(TEST_DATA);

	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;

	constructor(private dialog: MatDialog, private lobbyService: LobbyService) { }

	ngOnInit() {
		this.lobbyService.listLobbies().subscribe(
			lobbies => {
				console.log("Got lobbies:", lobbies);
				this.dataSource.data = lobbies.length > 0 ? lobbies : TEST_DATA;
			}
		);
	}

	ngAfterViewInit() {
		this.dataSource.paginator = this.paginator;
		this.dataSource.sort = this.sort;
	}

	applyFilter(event: Event) {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}



}

const TEST_DATA: Lobby[] = [
	{ owner: 'Alex', name: 'Fun Game', players: 1, maxPlayers: 4, game: { id: "blah", name: "Monopoly", thumbnail: '', modified: new Date() }, mode: 'playing', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Ryan', name: 'Come play', players: 2, maxPlayers: 4, game: { id: "blah", name: "Catan", thumbnail: '', modified: new Date() }, mode: 'lobby', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Tyler', name: 'Only Pro Gamers', players: 3, maxPlayers: 4, game: { id: "blah", name: "Eldritch Horror", thumbnail: '', modified: new Date() }, mode: 'lobby', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Casey', name: 'zzz', players: 4, maxPlayers: 4, game: { id: "blah", name: "Sorry", thumbnail: '', modified: new Date() }, mode: 'playing', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Dave', name: 'Best games here', players: 1, maxPlayers: 5, game: { id: "blah", name: "Eldritch Horror", thumbnail: '', modified: new Date() }, mode: 'lobby', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Devrin', name: 'Test Game', players: 1, maxPlayers: 2, game: { id: "blah", name: "Uno", thumbnail: '', modified: new Date() }, mode: 'playing', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Eelke', name: 'Only join if you want to have fun', players: 3, maxPlayers: 5, game: { id: "blah", name: "Eldritch Horror", thumbnail: '', modified: new Date() }, mode: 'lobby', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Adrian', name: 'yyy', players: 4, maxPlayers: 10, game: { id: "blah", name: "Secret Hitler", thumbnail: '', modified: new Date() }, mode: 'lobby', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Sergiu', name: 'xxx', players: 10, maxPlayers: 12, game: { id: "blah", name: "Codenames", thumbnail: '', modified: new Date() }, mode: 'playing', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Fred', name: 'This is a test name for testing purposes', players: 1, maxPlayers: 4, game: { id: "blah", name: "Monopoly", thumbnail: '', modified: new Date() }, mode: 'playing', roomInfo: { id: 'test', public: true, index: 0 } },
	{ owner: 'Bob', name: 'www', players: 1, maxPlayers: 4, game: { id: "blah", name: "Monopoly", thumbnail: '', modified: new Date() }, mode: 'lobby', roomInfo: { id: 'test', public: true, index: 0 } },
]