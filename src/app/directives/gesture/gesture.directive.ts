import { Directive, EventEmitter, Input, Output, OnInit, HostListener, ElementRef } from '@angular/core';
import { GestureController } from '@ionic/angular';

export type gestureNames = 'tap' | 'doubleTap' | 'press' | 'swipe';
export type directionNames = 'up' | 'down' | 'left' | 'right';
export type reportInterval = 'start' | 'live' | 'end' ;

export interface Gesture {
  name: gestureNames; // The gestureName that you want to use. Defined above.
  interval?: number; // Maximum time in ms between multiple taps
  enabled?: boolean; // Whether the gesture is enabled or not.
  direction?: directionNames[]; // Direction - used to Swipe
  threshold?: number;
  reportInterval?: reportInterval;
}

@Directive({
  selector: '[appGesture]'
})
export class GestureDirective implements OnInit {

  @Input() gestureOpts: Gesture[];
  // Events we can listen to.
  @Output() tap = new EventEmitter();
  @Output() doubleTap = new EventEmitter();
  @Output() press = new EventEmitter();
  @Output() swipe = new EventEmitter();

  tapGesture: Gesture = {
    name: 'tap',
    enabled: false,
    interval: 250,
  };

  doubleTapGesture: Gesture = {
    name: 'doubleTap',
    enabled: false,
    interval: 300,
  };

  pressGesture: Gesture = {
    name: 'press',
    enabled: false,
    interval: 251,
  };

  swipeGesture: Gesture = {
    name: 'swipe',
    enabled: false,
    interval: 250,
    threshold: 15, // the minimum distance before reporting a swipe.
    reportInterval: undefined,
    direction: [],
  };

  DIRECTIVE_GESTURES = [
    this.tapGesture, 
    this.doubleTapGesture, 
    this.pressGesture, 
    this.swipeGesture
  ];
  GESTURE_CREATED = false;
  lastTap = 0;
  tapCount = 0;
  tapTimeout = null;
  pressTimeout = null;
  isPressing: boolean = false;
  moveTimeout = null;
  isMoving: boolean = false;
  lastSwipeReport = null;

  constructor(
    private gestureCtrl: GestureController, 
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    this.DIRECTIVE_GESTURES
    .filter((dGesture) => this.gestureOpts.find(
      ({name}) => dGesture.name === name))
      .map((gesture) => {
        gesture.enabled = true;
        if (gesture.name === 'swipe') {
          const swipeGestureOpts = this.gestureOpts.find(({name}) => name == 'swipe');
          this.swipeGesture.direction = swipeGestureOpts.direction || ['left', 'right'];
          this.createGesture();
        }
      }
    );
    if (this.pressGesture.enabled && this.swipeGesture.enabled) {
      console.warn('Press and Swipe should not be enabled on the same element.');
    }
    if (this.gestureOpts.length === 0) {
      console.warn('No gestures were provided in Gestures array');
    }
  }

  @HostListener('touchstart', ['$event'])
  @HostListener('touchend', ['$event'])
  onPress(e) {
    if (!this.pressGesture.enabled) {
      return;
    } // Press is not enabled, don't do anything.
    this.handlePressing(e.type);
  }

  @HostListener('click', ['$event'])
  handleTaps(e) {
    const tapTimestamp = Math.floor(e.timeStamp);
    const isDoubleTap = this.lastTap + this.tapGesture.interval > tapTimestamp;
    if ((!this.tapGesture.enabled && !this.doubleTapGesture.enabled) || this.isPressing || this.isMoving) {
      return this.resetTaps();
    }
    this.tapCount++;
    if (isDoubleTap && this.doubleTapGesture.enabled) {
      this.emitTaps();
    } else if (!isDoubleTap) {
      this.tapTimeout = setTimeout(() => this.emitTaps(), this.tapGesture.interval);
    }
    this.lastTap = tapTimestamp;
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

  private handlePressing(type) { // touchend or touchstart
    if (type == 'touchstart') {
      this.pressTimeout = setTimeout(() => {
        this.isPressing = true;
        // this.press.emit('start');
      }, this.pressGesture.interval); // Considered a press if it's longer than interval (default: 251).
    } else if (type == 'touchend') {
      clearTimeout(this.pressTimeout);
      if (this.isPressing) {
        this.press.emit('end');
        this.resetTaps(); // Just incase this gets passed as a tap event too.
      }
      // Clicks have a natural delay of 300ms, so we have to account for that, before resetting isPressing.
      // Otherwise a tap event is emitted.
      setTimeout(() => this.isPressing = false, 50);
    }
  }

  private createGesture() {
    if (this.GESTURE_CREATED) {
      return;
    }
    const gesture = this.gestureCtrl.create({
      gestureName: 'socialGesture',
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

  private emitTaps() {
    if (this.tapCount === 1 && this.tapGesture.enabled) {
      this.tap.emit();
    } else if (this.tapCount === 2 && this.doubleTapGesture.enabled) {
      this.doubleTap.emit();
    }
    this.resetTaps();
  }

  private resetTaps() {
    clearTimeout(this.tapTimeout); // clear the old timeout
    this.tapCount = 0;
    this.tapTimeout = null;
    this.lastTap = 0;
  }

}
