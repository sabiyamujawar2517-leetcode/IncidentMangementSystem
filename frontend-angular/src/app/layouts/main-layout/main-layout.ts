import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ApiHealth, HealthService } from '../../core/services/health.service';
import { CurrentUserService } from '../../core/services/current-user.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';
import { Icon, IconName } from '../../shared/components/icon';
import { ToastContainer } from '../../shared/components/toast-container';

interface NavItem {
  label: string;
  link: string;
  icon: IconName;
  exact?: boolean;
}

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon, ConfirmDialog, ToastContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  protected readonly currentUser = inject(CurrentUserService);
  private readonly toast = inject(ToastService);
  private readonly health = inject(HealthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Overview',
      items: [{ label: 'Dashboard', link: '/dashboard', icon: 'dashboard' }],
    },
    {
      title: 'Incidents',
      items: [
        { label: 'All incidents', link: '/incidents', icon: 'list', exact: true },
        { label: 'My incidents', link: '/my-incidents', icon: 'person' },
        { label: 'Report incident', link: '/incidents/new', icon: 'add' },
      ],
    },
    {
      title: 'Reference data',
      items: [
        { label: 'Categories', link: '/categories', icon: 'label' },
        { label: 'Application services', link: '/services', icon: 'server' },
      ],
    },
  ];

  /** Mobile: off-canvas drawer open. Desktop: icon-only rail. */
  protected readonly mobileNavOpen = signal(false);
  protected readonly collapsed = signal(false);
  protected readonly userPanelOpen = signal(false);
  protected readonly userIdError = signal<string | null>(null);
  protected readonly apiHealth = signal<ApiHealth>('checking');

  private readonly mobileQuery = window.matchMedia('(max-width: 900px)');
  protected readonly isMobile = signal(this.mobileQuery.matches);
  protected readonly navExpanded = computed(() => (this.isMobile() ? this.mobileNavOpen() : !this.collapsed()));

  constructor() {
    const onMediaChange = (e: MediaQueryListEvent) => {
      this.isMobile.set(e.matches);
      if (!e.matches) this.mobileNavOpen.set(false);
    };
    this.mobileQuery.addEventListener('change', onMediaChange);
    this.destroyRef.onDestroy(() => this.mobileQuery.removeEventListener('change', onMediaChange));

    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.mobileNavOpen.set(false));
    this.checkHealth();
  }

  protected toggleNav(): void {
    if (this.isMobile()) this.mobileNavOpen.update((v) => !v);
    else this.collapsed.update((v) => !v);
  }

  protected checkHealth(): void {
    this.apiHealth.set('checking');
    this.health.check().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((h) => this.apiHealth.set(h));
  }

  protected saveUserId(value: string): void {
    if (!this.currentUser.set(value)) {
      this.userIdError.set('Enter a valid user id (GUID), e.g. 00000000-0000-0000-0000-000000000000.');
      return;
    }
    this.userIdError.set(null);
    this.userPanelOpen.set(false);
    this.toast.success('Acting user saved. The API validates it when you create, assign or comment.');
  }

  protected clearUserId(): void {
    this.currentUser.clear();
    this.userIdError.set(null);
    this.toast.info('Acting user cleared.');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.mobileNavOpen.set(false);
      this.userPanelOpen.set(false);
    }
  }
}
