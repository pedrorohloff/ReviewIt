import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UnsavedChangesService } from '@app/core/services/unsaved-changes.service';
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog/confirm-dialog';
import { OfflineBanner } from '@app/layout/offline-banner/offline-banner';
import { TopBar } from '@app/layout/top-bar/top-bar';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog, OfflineBanner, RouterOutlet, TopBar],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.css',
})
export class AppShell {
  protected readonly unsaved = inject(UnsavedChangesService);
}
