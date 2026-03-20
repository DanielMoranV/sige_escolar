import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TenantMigrationService {
  private readonly logger = new Logger(TenantMigrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async applyToSchema(slug: string): Promise<void> {
    this.logger.log(`Applying tenant schema to: ${slug}`);

    // __dirname = apps/api/dist/modules/admin/services (compiled) or src/... (ts-node)
    // Go up 6 levels to reach the monorepo root
    const sqlFilePath =
      process.env.TENANT_SCHEMA_SQL_PATH ??
      path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'prisma', 'tenant-schema.sql');
    const rawSql = fs.readFileSync(sqlFilePath, 'utf-8');

    // Replace all {SCHEMA} placeholders with the actual slug
    const populatedSql = rawSql.replace(/\{SCHEMA\}/g, slug);

    // Split into individual statements (split on semicolons followed by newlines or end of string)
    const statements = populatedSql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      const cleanStatement = statement.endsWith(';') ? statement : `${statement};`;
      try {
        await this.prisma.$executeRawUnsafe(cleanStatement);
      } catch (error) {
        this.logger.error(`Failed to execute statement: ${cleanStatement.substring(0, 100)}...`);
        throw error;
      }
    }

    this.logger.log(`Schema migration completed for tenant: ${slug}`);
  }
}
