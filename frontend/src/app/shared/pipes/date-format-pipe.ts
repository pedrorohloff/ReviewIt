import { Pipe, PipeTransform } from '@angular/core';
import { absoluteDate, dateTime, longDate, relativeTime } from '@app/shared/utils/format';

export type DateFormat = 'relative' | 'short' | 'long' | 'datetime';

@Pipe({
  name: 'dateFormat',
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: DateFormat = 'short'): string {
    if (!value) {
      return '';
    }

    switch (format) {
      case 'relative':
        return relativeTime(value);
      case 'long':
        return longDate(value);
      case 'datetime':
        return dateTime(value);
      default:
        return absoluteDate(value);
    }
  }
}
