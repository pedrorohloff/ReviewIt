import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@app/core/auth/auth.service';
import { SearchField } from '@app/features/search/search-field';
import { AvatarMenu } from '@app/layout/avatar-menu/avatar-menu';

@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarMenu, RouterLink, SearchField],
  templateUrl: './top-bar.html',
  styleUrl: './top-bar.css',
})
export class TopBar {
  protected readonly auth = inject(AuthService);
}
