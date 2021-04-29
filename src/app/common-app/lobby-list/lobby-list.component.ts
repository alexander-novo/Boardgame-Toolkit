import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Lobby } from 'src/app/services/lobby.service';

@Component({
	selector: 'app-lobby-list',
	templateUrl: './lobby-list.component.html',
	styleUrls: ['./lobby-list.component.scss']
})
export class LobbyListComponent implements AfterViewInit {
	displayedColumns: string[] = ['owner', 'name', 'gameName', 'players'];
	dataSource = new MatTableDataSource<Lobby>(TEST_DATA);

	@ViewChild(MatPaginator) paginator: MatPaginator;
	@ViewChild(MatSort) sort: MatSort;

	constructor() { }

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
	{ owner: 'Alex', name: 'Fun Game', players: 1, maxPlayers: 4, game: { id: "blah", name: "Monopoly", thumbnail: '', modified: new Date() } },
	{ owner: 'Ryan', name: 'Come play', players: 2, maxPlayers: 4, game: { id: "blah", name: "Catan", thumbnail: '', modified: new Date() } },
	{ owner: 'Tyler', name: 'Only Pro Gamers', players: 3, maxPlayers: 4, game: { id: "blah", name: "Eldritch Horror", thumbnail: '', modified: new Date() } },
	{ owner: 'Casey', name: 'zzz', players: 4, maxPlayers: 4, game: { id: "blah", name: "Sorry", thumbnail: '', modified: new Date() } },
	{ owner: 'Dave', name: 'Best games here', players: 1, maxPlayers: 5, game: { id: "blah", name: "Eldritch Horror", thumbnail: '', modified: new Date() } },
	{ owner: 'Devrin', name: 'Test Game', players: 1, maxPlayers: 2, game: { id: "blah", name: "Uno", thumbnail: '', modified: new Date() } },
	{ owner: 'Eelke', name: 'Only join if you want to have fun', players: 3, maxPlayers: 5, game: { id: "blah", name: "Eldritch Horror", thumbnail: '', modified: new Date() } },
	{ owner: 'Adrian', name: 'yyy', players: 4, maxPlayers: 10, game: { id: "blah", name: "Secret Hitler", thumbnail: '', modified: new Date() } },
	{ owner: 'Sergiu', name: 'xxx', players: 10, maxPlayers: 12, game: { id: "blah", name: "Codenames", thumbnail: '', modified: new Date() } },
	{ owner: 'Fred', name: 'This is a test name for testing purposes', players: 1, maxPlayers: 4, game: { id: "blah", name: "Monopoly", thumbnail: '', modified: new Date() } },
	{ owner: 'Bob', name: 'www', players: 1, maxPlayers: 4, game: { id: "blah", name: "Monopoly", thumbnail: '', modified: new Date() } },
]
