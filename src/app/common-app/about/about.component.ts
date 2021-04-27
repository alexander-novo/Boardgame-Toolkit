import { Component, OnInit } from '@angular/core';
import { Lightbox } from 'ngx-lightbox';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  album:any = [];
  constructor(private _lightbox: Lightbox) { 
    this.album.push({'src':'/assets/img/project-poster.png', 'thumb':'/assets/img/project-poster-thumb.png'});
  }

  open(index: number): void {
    this._lightbox.open(this.album, index);
  }

  close(): void {
    this._lightbox.close();
  }
  
  ngOnInit(): void {
  }

}