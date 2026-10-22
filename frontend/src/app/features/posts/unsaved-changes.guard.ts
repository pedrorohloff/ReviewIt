import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { UnsavedChangesService } from '@app/core/services/unsaved-changes.service';
import type { PostEditorPage } from './post-editor-page';

/**
 * Leaves the editor freely when nothing changed, otherwise asks first. The
 * dialog lives in `AppShell`, so it survives the navigation that is waiting.
 */
export const unsavedChangesGuard: CanDeactivateFn<PostEditorPage> = (page) => {
  if (page.canLeave()) {
    return true;
  }

  return inject(UnsavedChangesService).ask();
};
