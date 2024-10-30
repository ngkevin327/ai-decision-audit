import { Module } from '@nestjs/common';
import { TracesRepository } from './traces.repository';

@Module({
  providers: [TracesRepository],
  exports: [TracesRepository],
})
export class TracesModule {}
