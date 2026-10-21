import { Pipe, PipeTransform } from '@angular/core';
import { relativeTime } from '@app/shared/utils/format';

@Pipe({
  name: 'relativeTime',
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date): string {
    return relativeTime(value);
  }
}
