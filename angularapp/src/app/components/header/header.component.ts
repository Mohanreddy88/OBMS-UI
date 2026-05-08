import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';
import { DatasharingService } from 'src/app/service/datasharing.service';
import { SidebarService } from 'src/app/service/sidebar.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  subscription: any;
  currentUser: string = '';

  constructor(private _dataService: DatasharingService, private sidebarService: SidebarService,
    private _router: Router, private authService: AuthService
  ) { }
  dateTime: Date | undefined
  time = new Date();
  intervalId: any;
  ngOnInit(): void {
    this.currentUser = sessionStorage.getItem('username')!;
    if (this.currentUser == null) {
      this._dataService.getUsername().subscribe((username) => {
        this.currentUser = username;
      });
    }
    this.dateTime = new Date();
    // Using Basic Interval
    this.intervalId = setInterval(() => {
      this.time = new Date();
    }, 1000);

  }
  ngOnDestroy() {
    clearInterval(this.intervalId);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  toggleSubmenu(menu: string) {
    this._dataService.setMenuName(menu);
    this._router.navigate(['/dashboard']);
  }
  logout() {
    this.authService.getManulLogout();
    this._router.navigate(['/login']);
  }
}
