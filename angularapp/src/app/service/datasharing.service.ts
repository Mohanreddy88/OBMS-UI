import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatasharingService {
  private renderer: Renderer2;
  private username$: BehaviorSubject<any> = new BehaviorSubject(null);
  private menuname$: BehaviorSubject<any> = new BehaviorSubject(null);
  private selectedInvoice$ = new BehaviorSubject<any>(null);

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
   }
  scrollToTop(): void {
    const mainPanel = this.renderer.selectRootElement('.wlt-c-furg-mainpanel', true);
    if (mainPanel) {
      mainPanel.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  getUsername(): Observable<string> {
    return this.username$.asObservable();
  }
  setUsername(userName: string) {
    this.username$.next(userName);
  }

  getMenuName(): Observable<string> {
    return this.menuname$.asObservable();
  }
  setMenuName(menuName: string) {
    this.menuname$.next(menuName);
  }

  setSelectedInvoice(data: any) {
    this.selectedInvoice$.next(data);
  }

  getSelectedInvoice(): Observable<any> {
    return this.selectedInvoice$.asObservable();
  }

  clearSelectedInvoice() {
    this.selectedInvoice$.next(null);
  }
}
