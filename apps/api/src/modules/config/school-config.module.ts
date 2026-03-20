import { Module } from '@nestjs/common';
import { SchoolConfigService } from './school-config.service';
import { SchoolConfigController } from './school-config.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SchoolConfigService],
  controllers: [SchoolConfigController],
})
export class SchoolConfigModule {}
