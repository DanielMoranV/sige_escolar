import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DniLookupService } from './dni-lookup.service';

@Module({
  imports: [ConfigModule],
  providers: [DniLookupService],
  exports: [DniLookupService],
})
export class DniModule {}
