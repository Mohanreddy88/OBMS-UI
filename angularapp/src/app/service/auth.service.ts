import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private inactivityTimer: any;
  private readonly timeoutDuration = 10 * 60 * 1000; // 3 minutes
  private isIdle = false;

  constructor(private router: Router) {
    this.initializeActivityTracking();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.startInactivityTimer();
    //this.resetInactivityTimer(); // Start/reset timer on login
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getManulLogout() {
  localStorage.setItem('manualLogout', 'true');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    this.clearToken();
    this.stopInactivityTimer();
    this.router.navigate(['/login']);
  }

  // === Inactivity Timer Management ===

  private initializeActivityTracking(): void {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    events.forEach(event => {
      window.addEventListener(event, () => {
        if (!this.isAuthenticated()) return;

        if (this.isIdle) {
          // User was idle and now interacted → logout
          this.logout();
          return;
        }

        // Not idle → Reset the timer
        this.startInactivityTimer();
      });
    });

    // If user already logged in on refresh
    if (this.isAuthenticated()) {
      this.startInactivityTimer();
    }
  }

  private resetInactivityTimer(): void {
    this.stopInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      this.logout();
    }, this.timeoutDuration);
  }

  private startInactivityTimer(): void {
    this.stopInactivityTimer();
    this.isIdle = false;

    this.inactivityTimer = setTimeout(() => {
      this.isIdle = true; // only mark idle, DO NOT logout
    }, this.timeoutDuration);
  }

  private stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
  }
}
