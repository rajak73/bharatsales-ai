import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExportJob } from '@bharatsales/shared-types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(
    @InjectModel('ExportJob') private exportJobModel: Model<ExportJob>,
    // In a real app we inject domain services to fetch data, e.g. OrdersService
  ) {}

  async requestExport(organizationId: string, userId: string, entityType: string, filters: any): Promise<ExportJob> {
    const job = new this.exportJobModel({
      organizationId,
      requestedByUserId: userId,
      entityType,
      filters,
      status: 'queued'
    });
    
    await job.save();

    // Fire and forget worker processing
    this.processExport(job._id.toString(), organizationId).catch(err => {
      this.logger.error(`Export processing failed for job ${job._id}`, err);
    });

    return job as any;
  }

  async getJobs(organizationId: string, userId: string): Promise<ExportJob[]> {
    return this.exportJobModel.find({ organizationId, requestedByUserId: userId }).sort({ createdAt: -1 }).exec() as any;
  }

  async getJob(organizationId: string, jobId: string): Promise<ExportJob> {
    const job = await this.exportJobModel.findOne({ _id: jobId, organizationId }).exec();
    if (!job) {
      throw new NotFoundException('Export job not found');
    }
    return job as any;
  }

  private async processExport(jobId: string, organizationId: string) {
    const job = await this.exportJobModel.findById(jobId);
    if (!job) return;

    try {
      job.status = 'processing';
      await job.save();

      // Mock processing delay for large CSV generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In reality, query the DB based on job.entityType and job.filters
      // Create a CSV string
      const csvContent = `id,organizationId,createdAt\n1,${organizationId},${new Date().toISOString()}\n`;

      // Tenant-scoped file storage (mocked via local tmp directory for now)
      const exportDir = path.join(process.cwd(), 'uploads', 'exports', organizationId);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const fileName = `${job.entityType}_${Date.now()}.csv`;
      const filePath = path.join(exportDir, fileName);
      
      fs.writeFileSync(filePath, csvContent);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

      job.status = 'completed';
      job.fileUrl = `/api/v1/exports/download/${organizationId}/${fileName}`;
      job.expiresAt = expiresAt.toISOString() as any;
      await job.save();

    } catch (error: any) {
      this.logger.error(`Failed to process export job ${jobId}`, error);
      job.status = 'failed';
      job.errorDetails = error.message;
      await job.save();
    }
  }
}
