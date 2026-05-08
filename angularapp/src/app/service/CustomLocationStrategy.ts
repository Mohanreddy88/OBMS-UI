import { Injectable } from '@angular/core';
import { PlatformLocation, LocationStrategy, HashLocationStrategy } from '@angular/common';

@Injectable()
export class CustomLocationStrategy extends HashLocationStrategy {
  constructor(platformLocation: PlatformLocation) {
    super(platformLocation);
  }

  override prepareExternalUrl(internal: string): string {    
    // Remove the default '#' and replace with FWG
    const url = super.prepareExternalUrl(internal);
    return url.replace('#', 'FWG2026');
  }

  override path(includeHash: boolean = false): string {   
    const path = super.path(includeHash);
    return path.replace('#', 'FWG2026');
  }
}
