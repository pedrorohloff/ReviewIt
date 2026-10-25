import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginPromptService } from '@app/core/auth/login-prompt.service';
import { ConfirmDialog } from '@app/shared/ui/confirm-dialog/confirm-dialog';

/**
 * Root-level dialog shared by every anonymous action that needs an account.
 * Keeping it outside the routed shell means the prompt survives a menu close
 * and works on any screen.
 */
@Component({
  selector: 'app-login-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfirmDialog],
  templateUrl: './login-prompt.html',
})
export class LoginPrompt {
  protected readonly prompt = inject(LoginPromptService);

  protected confirm(): void {
    void this.prompt.confirm();
  }
}
