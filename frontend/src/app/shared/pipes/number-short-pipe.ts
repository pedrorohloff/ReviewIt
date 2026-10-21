import { Pipe, PipeTransform } from '@angular/core';
import { numberShort } from '@app/shared/utils/format';

@Pipe({
  name: 'numberShort',
})
export class NumberShortPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return numberShort(value ?? 0);
  }
}
