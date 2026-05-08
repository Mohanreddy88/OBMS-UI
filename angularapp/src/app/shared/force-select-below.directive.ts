import { Directive, AfterViewInit } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { ConnectedPosition } from '@angular/cdk/overlay';

@Directive({
  selector: '[appForceSelectBelow]'
})
export class ForceSelectBelowDirective implements AfterViewInit {

  constructor(private matSelect: MatSelect) {}

  ngAfterViewInit() {
    const alwaysBelow: ConnectedPosition[] = [
      {
        originX: 'start',
        originY: 'bottom', // trigger origin bottom
        overlayX: 'start',
        overlayY: 'top',    // overlay appears below
        offsetY: 0
      }
    ];

    // Wait until overlay is initialized
    setTimeout(() => {
      const overlayDir = (this.matSelect as any)._overlayDir;
      if (overlayDir && overlayDir.positions) {
        overlayDir.positions = alwaysBelow;
      }
    });
  }
}
