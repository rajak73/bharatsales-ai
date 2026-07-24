import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExportJob } from '@bharatsales/shared-types';
import * as fs from 'fs';
import * as path from 'path';

@Processor('exports')
export class ExportsProcessor {
  private readonly logger = new Logger(ExportsProcessor.name);

  constructor(
    @InjectModel('ExportJob') private exportJobModel: Model<ExportJob>,
    @InjectModel('Order') private orderModel: Model<any>,
    @InjectModel('ReturnOrder') private returnModel: Model<any>,
    @InjectModel('Invoice') private invoiceModel: Model<any>,
    @InjectModel('Collection') private collectionModel: Model<any>,
  ) {}

  @Process('generate-export')
  async handleExport(jobPayload: Job<{ jobId: string, organizationId: string }>) {
    const { jobId, organizationId } = jobPayload.data;
    this.logger.debug(`Processing export job ${jobId}`);

    const job = await this.exportJobModel.findById(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      await job.save();

      let data: any[] = [];
      const query = { organizationId, ...job.filters };

      if (job.entityType === 'orders') {
        data = await this.orderModel.find(query).lean().exec();
      } else if (job.entityType === 'returns') {
        data = await this.returnModel.find(query).lean().exec();
      } else if (job.entityType === 'invoices') {
        data = await this.invoiceModel.find(query).lean().exec();
      } else if (job.entityType === 'collections') {
        data = await this.collectionModel.find(query).lean().exec();
      }

      let csvContent = '';
      if (data.length > 0) {
        const headers = Object.keys(data[0]).filter(k => k !== '_id' && k !== '__v');
        csvContent += headers.join(',') + '\n';
        for (const row of data) {
          const rowData = headers.map(header => {
            let val = row[header];
            if (typeof val === 'object' && val !== null) {
              val = JSON.stringify(val).replace(/"/g, '""');
              return `"${val}"`;
            }
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
              val = val.replace(/"/g, '""');
              return `"${val}"`;
            }
            return val;
          });
          csvContent += rowData.join(',') + '\n';
        }
      } else {
        csvContent = 'No data found\n';
      }

      const exportDir = path.join(process.cwd(), 'uploads', 'exports', organizationId);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const fileName = `${job.entityType}_${Date.now()}.csv`;
      const filePath = path.join(exportDir, fileName);
      
      fs.writeFileSync(filePath, csvContent);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      job.status = 'completed';
      job.fileUrl = `/api/v1/exports/download/${organizationId}/${fileName}`;
      job.expiresAt = expiresAt.toISOString() as any;
      await job.save();
      this.logger.debug(`Completed export job ${jobId}`);

    } catch (error: any) {
      this.logger.error(`Failed to process export job ${jobId}`, error);
      job.status = 'failed';
      job.errorDetails = error.message;
      await job.save();
      throw error;
    }
  }
}
