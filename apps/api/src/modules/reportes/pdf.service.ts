import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import { libretaTemplate } from './templates/libreta.template';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private browser: puppeteer.Browser;

  constructor() {
    this.initBrowser();
    
    // Helper para minúsculas
    handlebars.registerHelper('lowercase', function(str) {
      if(str && typeof str === 'string') {
        return str.toLowerCase();
      }
      return '';
    });
  }

  private async initBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.logger.log('Puppeteer browser initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer browser', error);
    }
  }

  async generateLibretaPdf(data: any): Promise<Buffer> {
    if (!this.browser) {
      await this.initBrowser();
    }

    const template = handlebars.compile(libretaTemplate);
    const html = template({
      colegio: { nombre: data.estudiante.colegio_nombre },
      periodo: data.periodo,
      estudiante: data.estudiante,
      areas: data.areas,
      asistencia: {
        presentes: parseInt(data.asistencia.presentes || '0'),
        tardanzas: parseInt(data.asistencia.tardanzas || '0'),
        faltas_justificadas: parseInt(data.asistencia.faltas_justificadas || '0'),
        faltas_injustificadas: parseInt(data.asistencia.faltas_injustificadas || '0')
      }
    });

    const page = await this.browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await page.close();
    
    // puppeteer .pdf returns Uint8Array starting from some version, we wrap it in Buffer to be safe
    return Buffer.from(pdfBuffer);
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
