import { Module } from '@nestjs/common';
import { TracesModule } from '../traces/traces.module';
import { TracesQueryController } from './traces-query.controller';
import { TracesQueryService } from './traces-query.service';

@Module({
  imports: [TracesModule],
  controllers: [TracesQueryController],
  providers: [TracesQueryService],
  exports: [TracesQueryService],
})
export class QueryModule {}
