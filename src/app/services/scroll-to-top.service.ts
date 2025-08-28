import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable()
export class ScrollToTopService {
  private isInitialized = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Don't initialize immediately to avoid issues during SSR
    // Initialize when first method is called
  }

  private initializeScrollToTop(): void {
    // Only run in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd)
        )
        .subscribe(() => {
          this.scrollToTop();
        });

      // Handle browser back/forward buttons
      window.addEventListener('popstate', () => {
        // Small delay to ensure route change is processed
        setTimeout(() => {
          this.scrollToTop();
        }, 100);
      });

      // Handle page load/refresh events
      window.addEventListener('load', () => {
        this.scrollToTop();
      });

      // Handle DOM content loaded
      document.addEventListener('DOMContentLoaded', () => {
        this.scrollToTop();
      });
    }
  }

  public scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize if not already done
      if (!this.isInitialized) {
        this.initializeScrollToTop();
        this.isInitialized = true;
      }
      
      // Smooth scroll to top
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  }

  public scrollToTopInstant(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initialize if not already done
      if (!this.isInitialized) {
        this.initializeScrollToTop();
        this.isInitialized = true;
      }
      
      // Instant scroll to top
      window.scrollTo(0, 0);
    }
  }

  public scrollToTopAfterDelay(delayMs: number = 100): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.scrollToTop();
      }, delayMs);
    }
  }

  public scrollToTopOnContentLoad(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Wait for next tick to ensure content is rendered
      setTimeout(() => {
        this.scrollToTop();
      }, 0);
    }
  }

  public scrollToTopOnResize(): (() => void) | void {
    if (isPlatformBrowser(this.platformId)) {
      // Debounced scroll to top on resize
      let resizeTimeout: number;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = window.setTimeout(() => {
          this.scrollToTop();
        }, 150);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
      };
    }
  }

  public ensureScrollAtTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check if we're already at the top
      if (window.scrollY > 0) {
        this.scrollToTop();
      }
    }
  }

  public scrollToTopWithFallback(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Try smooth scrolling first
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      } catch (error) {
        // Fallback to instant scroll if smooth scrolling is not supported
        console.warn('Smooth scrolling not supported, using instant scroll');
        this.scrollToTopInstant();
      }
    }
  }
}
