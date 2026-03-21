import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SchoolConfigModule } from '../config/school-config.module';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [SchoolConfigModule, DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
