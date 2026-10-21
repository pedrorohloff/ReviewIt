import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastRegion } from '@app/layout/toast-region/toast-region';
import { IconSprite } from './shared/ui/icon/icon-sprite';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconSprite, RouterOutlet, ToastRegion],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
