import { Directive, EventEmitter, Output, OnInit, HostListener } from '@angular/core';

@Directive({
  selector: '[appTap]'
})
export class TapDirective implements OnInit {

  @Output() tap = new EventEmitter();
  @Output() doubleTap = new EventEmitter();
  lastTap = 0;
  tapCount = 0;
  tapTimeout = null;
  tapGesture = {
    name: 'tap',
    enabled: false,
    interval: 250,
  };
  doubleTapGesture = {
    name: 'doubleTap',
    enabled: false,
    interval: 300,
  };

  constructor() { }

  ngOnInit(): void {
    this.tapGesture.enabled = true;
    this.doubleTapGesture.enabled = true;
  }

  @HostListener('click', ['$event'])
  handleTaps(e) {
    const tapTimestamp = Math.floor(e.timeStamp);
    const isDoubleTap = this.lastTap + this.tapGesture.interval > tapTimestamp;
    if (!this.tapGesture.enabled && !this.doubleTapGesture.enabled) {
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
