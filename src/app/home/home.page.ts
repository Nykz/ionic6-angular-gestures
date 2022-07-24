import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor() {}

  onTap(event) {
    console.log('tap: ', event);
  }

  onDoubleTap(event) {
    console.log('double tap: ', event);
  }

  onPress(event) {
    console.log('press: ', event);
  }

  onSwipe(event) {
    console.log(event);
  }

}
