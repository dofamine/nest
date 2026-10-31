import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ObservePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log(`value: ${JSON.stringify(value)}`);
    console.log(`metadata: ${JSON.stringify(metadata)}`);
    return value;
  }
}
