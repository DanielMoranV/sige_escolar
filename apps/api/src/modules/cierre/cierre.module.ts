import { Module } from '@nestjs/common';
import { CierreService } from './cierre.service';
import { CierreController } from './cierre.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CierreController],
  providers: [CierreService],
})
export class CierreModule {}
