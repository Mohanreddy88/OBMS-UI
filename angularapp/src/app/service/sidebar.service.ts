import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private submenuState = new BehaviorSubject<{ [key: string]: boolean }>({});
  submenuState$ = this.submenuState.asObservable();

  toggleSubmenu(menu: string) {
    const currentState = this.submenuState.value;
    currentState[menu] = !currentState[menu];
    this.submenuState.next(currentState);
  }

  isSubmenuOpen(menu: string): boolean {
    return !!this.submenuState.value[menu];
  }
}
