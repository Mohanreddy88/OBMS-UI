import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { SidebarService } from 'src/app/service/sidebar.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  activeMenu: string | null = null;
  constructor(private router: Router, private _dataService: DatasharingService, private sidebarService: SidebarService) {
  }

  ngOnInit(): void {
    this._dataService.getMenuName().subscribe(menuName => {
      this.activeMenu = menuName;
    });

    const url = this.router.url;

    if (url.startsWith('/finance')) this.activeMenu = 'finance';
    else if (url.startsWith('/master')) this.activeMenu = 'master';
    else if (url.startsWith('/inventory')) this.activeMenu = 'inventory';
    else if (url.startsWith('/payroll')) this.activeMenu = 'payroll';
    else if (url.startsWith('/quotation')) this.activeMenu = 'quotation';
    else if (url.startsWith('/administration')) this.activeMenu = 'administration';
    else if (url.startsWith('/accounting')) this.activeMenu = 'accounting';
  }

  toggleSubmenu(menu: string) {
    if (this.activeMenu !== menu) {
      this.activeMenu = menu;   // switch to new menu
    }
  }

  isSubmenuOpen(menu: string): boolean {
    return this.activeMenu === menu;
  }
}
