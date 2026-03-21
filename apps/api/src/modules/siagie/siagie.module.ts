import { Module } from '@nestjs/common';
import { SiagieService } from './siagie.service';
import { ExcelService } from './excel.service';
import { SiagieController } from './siagie.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SiagieController],
  providers: [SiagieService, ExcelService],
  exports: [ExcelService]
})
export class SiagieModule {}
