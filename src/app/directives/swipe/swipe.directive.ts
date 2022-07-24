import { Directive, EventEmitter, Output, OnInit, ElementRef } from '@angular/core';
import { GestureController } from '@ionic/angular';

@Directive({
  selector: '[appSwipe]'
})
export class SwipeDirective implements OnInit {

  @Output() swipe = new EventEmitter();
  swipeGesture = {
    name: 'swipe',
    enabled: false,
    interval: 250,
    threshold: 15, // the minimum distance before reporting a swipe (in dp or dip. Density-independent Pixels - an abstract unit that is based on the physical density of the screen).
    reportInterval: undefined,
    direction: [],
  };
  GESTURE_CREATED = false;
  moveTimeout = null;
  isMoving: boolean = false;
  lastSwipeReport = null;

  constructor(
    private gestureCtrl: GestureController, 
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.swipeGesture.enabled = true;
    this.swipeGesture.direction = ['left', 'right'];
    this.createGesture();
  }

  private createGesture() {
    if (this.GESTURE_CREATED) {
      return;
    }
    const gesture = this.gestureCtrl.create({
      gestureName: 'swipe-gesture',
      el: this.el.nativeElement,
      onStart: () => {
        if (this.swipeGesture.enabled) {
          this.isMoving = true;
          this.moveTimeout = setInterval(() => {
            this.isMoving = false;
          }, 249);
        }
      },
      onMove: ($event) => {
        if (this.swipeGesture.enabled) {
          this.handleMoving('moving', $event);
        }
      },
      onEnd: ($event) => {
        if (this.swipeGesture.enabled) {
          this.handleMoving('moveend', $event);
        }
      },
    }, true);
    gesture.enable();
    this.GESTURE_CREATED = true;
  }

  private handleMoving(moveType, $event) {
    if (this.moveTimeout !== null) {
      clearTimeout(this.moveTimeout);
      this.moveTimeout = null;
    }
    const deltaX = $event.deltaX;
    const deltaY = $event.deltaY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const reportInterval = this.swipeGesture.reportInterval || 'live';
    const threshold = this.swipeGesture.threshold;
    if (absDeltaX < threshold && absDeltaY < threshold) {  // We haven't moved enough to consider it a swipe.
      return;
    }
    const shouldReport = this.isMoving &&
     (
      (reportInterval === 'start' && this.lastSwipeReport === null) ||
      (reportInterval === 'live') ||
      (reportInterval === 'end' && moveType == 'moveend')
     );
    this.lastSwipeReport = $event.timeStamp;
    if (shouldReport) {
      let emitObj = {
        dirX: undefined,
        dirY: undefined,
        swipeType: moveType,
        ...$event,
      };
      if (absDeltaX > threshold) {
        if (deltaX > 0) {
          emitObj.dirX = 'right';
        } else if (deltaX < 0) {
          emitObj.dirX = 'left';
        }
      }
      if (absDeltaY > threshold) {
        if (deltaY > 0) {
          emitObj.dirY = 'down';
        } else if (deltaY < 0) {
          emitObj.dirY = 'up';
        }
      }
      const dirArray = this.swipeGesture.direction;
      if (dirArray.includes(emitObj.dirX) ||  dirArray.includes(emitObj.dirY)) {
         this.swipe.emit(emitObj);
      }
    }
    if ((moveType == 'moveend' && this.lastSwipeReport !== null)) {
      this.isMoving = false;
      this.lastSwipeReport = null;
    }
  }

}
