import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TapDirective } from './tap/tap.directive';
import { PressDirective } from './press/press.directive';
import { SwipeDirective } from './swipe/swipe.directive';
import { GestureDirective } from './gesture/gesture.directive';

@NgModule({
  declarations: [
    TapDirective,
    PressDirective,
    SwipeDirective,
    GestureDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TapDirective,
    PressDirective,
    SwipeDirective,
    GestureDirective
  ]
})
export class DirectivesModule { }
