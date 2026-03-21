import { Module } from '@nestjs/common';
import { CierreService } from './cierre.service';
import { PromocionService } from './promocion.service';
import { CierreController } from './cierre.controller';
import { DatabaseModule } from '../../database/database.module';
import { SiagieModule } from '../siagie/siagie.module';

@Module({
  imports: [DatabaseModule, SiagieModule],
  controllers: [CierreController],
  providers: [CierreService, PromocionService],
})
export class CierreModule {}
