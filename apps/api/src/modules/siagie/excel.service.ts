import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  async generateAsistenciaExcel(data: any[], mes: number, diasLectivos: number): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Asistencia');

    sheet.columns = [
      { header: 'CODIGO_SIAGIE', key: 'codigo_siagie', width: 20 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'APELLIDOS_NOMBRES', key: 'nombres', width: 40 },
      { header: 'DIAS_ASISTIDOS', key: 'asistencias', width: 15 },
      { header: 'DIAS_FALTA_JUSTIFICADA', key: 'faltas_justificadas', width: 25 },
      { header: 'DIAS_FALTA_INJUSTIFICADA', key: 'faltas_injustificadas', width: 25 }
    ];

    sheet.getRow(1).font = { bold: true };

    for (const row of data) {
      sheet.addRow({
        codigo_siagie: row.codigo_siagie || `000000${row.dni || ''}`,
        dni: row.dni,
        nombres: `${row.apellido_paterno} ${row.apellido_materno || ''}, ${row.nombres}`,
        asistencias: parseInt(row.asistencias || '0', 10),
        faltas_justificadas: parseInt(row.faltas_justificadas || '0', 10),
        faltas_injustificadas: parseInt(row.faltas_injustificadas || '0', 10)
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateCierreExcel(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Cierre Anual');

    sheet.columns = [
      { header: 'CODIGO_SIAGIE', key: 'codigo_siagie', width: 20 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'APELLIDOS_NOMBRES', key: 'nombres', width: 40 },
      { header: 'RESULTADO_FINAL', key: 'resultado', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const row of data) {
      sheet.addRow({
        codigo_siagie: row.codigo_siagie || `000000${row.dni || ''}`,
        dni: row.dni,
        nombres: `${row.apellido_paterno} ${row.apellido_materno || ''}, ${row.nombres}`,
        resultado: row.resultado
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateNotasExcel(data: any[], periodoNombre: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Notas');

    sheet.columns = [
      { header: 'CODIGO_SIAGIE', key: 'codigo_siagie', width: 20 },
      { header: 'DNI', key: 'dni', width: 15 },
      { header: 'APELLIDOS_NOMBRES', key: 'nombres', width: 40 },
      { header: 'AREA', key: 'area', width: 30 },
      { header: 'COMPETENCIA', key: 'competencia', width: 40 },
      { header: 'CALIFICATIVO', key: 'nota', width: 15 },
      { header: 'CONCLUSION_DESCRIPTIVA', key: 'conclusion', width: 50 }
    ];

    sheet.getRow(1).font = { bold: true };

    for (const row of data) {
      sheet.addRow({
        codigo_siagie: row.codigo_siagie || `000000${row.dni || ''}`,
        dni: row.dni,
        nombres: `${row.apellido_paterno} ${row.apellido_materno || ''}, ${row.nombres}`,
        area: row.area_nombre,
        competencia: row.competencia_nombre,
        nota: row.calificativo_literal || row.calificativo_numerico || '—',
        conclusion: row.conclusion_descriptiva || ''
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
