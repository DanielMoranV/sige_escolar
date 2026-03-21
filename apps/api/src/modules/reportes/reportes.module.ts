import { Module } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { PdfService } from './pdf.service';
import { ReportesController } from './reportes.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportesController],
  providers: [ReportesService, PdfService],
})
export class ReportesModule {}
