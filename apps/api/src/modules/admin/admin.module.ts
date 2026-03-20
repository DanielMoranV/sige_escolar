import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';

// Services
import { TenantMigrationService } from './services/tenant-migration.service';
import { TenantSeedService } from './services/tenant-seed.service';
import { PeriodosService } from './services/periodos.service';

// Tenants
import { TenantsAdminService } from './tenants-admin/tenants-admin.service';
import { TenantsAdminController } from './tenants-admin/tenants-admin.controller';

// Superadmins
import { SuperadminsService } from './superadmins/superadmins.service';
import { SuperadminsController } from './superadmins/superadmins.controller';

// Dashboard
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardController } from './dashboard/dashboard.controller';

@Module({
  imports: [DatabaseModule],
  providers: [
    TenantMigrationService,
    TenantSeedService,
    PeriodosService,
    TenantsAdminService,
    SuperadminsService,
    DashboardService,
  ],
  controllers: [
    TenantsAdminController,
    SuperadminsController,
    DashboardController,
  ],
})
export class AdminModule {}
