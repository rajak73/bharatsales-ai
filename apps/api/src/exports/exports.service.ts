import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExportJob } from '@bharatsales/shared-types';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExportsService {
  private readonly logger = new Logger(ExportsService.name);

  constructor(
    @InjectModel('ExportJob') private exportJobModel: Model<ExportJob>,
    @InjectQueue('exports') private exportsQueue: Queue,
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

    await this.exportsQueue.add('generate-export', {
      jobId: job._id.toString(),
      organizationId,
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
}
