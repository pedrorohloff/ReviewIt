import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconSprite } from './shared/ui/icon/icon-sprite';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconSprite, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
