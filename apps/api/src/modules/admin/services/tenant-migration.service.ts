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

    const sqlFilePath =
      process.env.TENANT_SCHEMA_SQL_PATH ??
      path.resolve(__dirname, '..', '..', '..', '..', '..', '..', 'prisma', 'tenant-schema.sql');
    const rawSql = fs.readFileSync(sqlFilePath, 'utf-8');

    // Split into individual statements - handle different line endings and comments
    const statements = rawSql
      .split(/;\s*(?:\r\n|\n|\r|$)/)
      .map((s) => s.trim())
      // Filter out empty blocks or blocks that are only comments
      .filter((s) => s.length > 0 && !s.split('\n').every(line => line.trim().startsWith('--')))
      .map(s => s.replace(/\{SCHEMA\}/g, slug));

    this.logger.log(`[${slug}] Encontradas ${statements.length} sentencias SQL para ejecutar`);

    // Postgres error codes safe to ignore (object already exists — idempotency)
    const IGNORABLE_CODES = new Set(['42710', '42P07', '42723', '42701']);

    for (const statement of statements) {
      const cleanStatement = statement.endsWith(';') ? statement : `${statement};`;
      try {
        await this.prisma.$executeRawUnsafe(cleanStatement);
        this.logger.log(`[${slug}] Executed: ${cleanStatement.substring(0, 60)}...`);
      } catch (error) {
        // Prisma wraps PostgreSQL error codes inside meta.code
        const pgCode: string | undefined = (error as any)?.meta?.code ?? (error as any)?.code;
        if (pgCode && IGNORABLE_CODES.has(pgCode)) {
          this.logger.warn(`[${slug}] Skipping existing object (${pgCode}): ${cleanStatement.substring(0, 60)}...`);
          continue;
        }
        this.logger.error(`Failed: ${cleanStatement.substring(0, 200)}...\nError code: ${(error as any)?.meta?.code}\nError msg:  ${(error as any)?.meta?.message ?? (error as any)?.message}`);
        throw error;
      }
    }

    this.logger.log(`Schema migration completed for tenant: ${slug}`);
  }
}
