import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lastActive',
})
export class LastActivePipe implements PipeTransform {
  transform(value: string | null): unknown {
    if (!value) return '—';
    const minutes = Math.max(
      0,
      Math.floor((Date.now() - new Date(value).getTime()) / 60_000),
    );
    if (minutes < 1) return 'Just now';
    const [amount, unit] =
      minutes < 60
        ? [minutes, 'minute']
        : minutes < 1440
          ? [Math.floor(minutes / 60), 'hour']
          : minutes < 10080
            ? [Math.floor(minutes / 1440), 'day']
            : [Math.floor(minutes / 10080), 'week'];
    return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`;
  }
}
