import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StateMessage } from '../../shared/components/state-message';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card">
      <app-state-message kind="empty" title="Page not found" message="The page you are looking for doesn't exist." [retryable]="false">
        <a class="btn btn-primary btn-sm" routerLink="/dashboard">Go to dashboard</a>
      </app-state-message>
    </div>
  `,
})
export class NotFound {}
