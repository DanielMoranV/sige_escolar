import { Module } from '@nestjs/common';
import { SiagieService } from './siagie.service';
import { SiagieController } from './siagie.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SiagieController],
  providers: [SiagieService],
})
export class SiagieModule {}
