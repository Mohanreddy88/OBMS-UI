import { Directive, AfterViewInit, OnDestroy } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { Subscription } from 'rxjs';

@Directive({
  selector: 'mat-select'
})
export class MatSelectScrollDirective implements AfterViewInit, OnDestroy {
  private sub!: Subscription;

  constructor(private matSelect: MatSelect) {}

  ngAfterViewInit() {
    // Listen to when dropdown opens
    this.sub = this.matSelect.openedChange.subscribe(opened => {
       console.log('Dropdown opened:', opened);
      if (!opened) return;

      setTimeout(() => {
        // Get selected option index
        const optionsArray = this.matSelect.options.toArray();
        const selectedIndex = optionsArray.findIndex(o => o.selected);

        if (selectedIndex < 0) return;

        // Access the overlay panel
        const panel = document.querySelector(
          '.cdk-overlay-pane .mat-select-panel'
        ) as HTMLElement;

        if (!panel) return;

        // Get option height from CSS
        const optionHeight = panel.querySelector('.mat-option')?.clientHeight || 36;

        // Calculate scrollTop so selected option is centered
        const scrollTop = selectedIndex * optionHeight - panel.clientHeight / 2 + optionHeight / 2;

        panel.scrollTop = scrollTop > 0 ? scrollTop : 0;
      }, 50); // small delay ensures panel is rendered
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
