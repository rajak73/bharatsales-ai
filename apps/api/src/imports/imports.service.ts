import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ImportJobDocument } from '../schemas';
import { parse } from 'csv-parse';
import { z } from 'zod';

const ProductImportSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  mrp: z.string().transform(Number),
  pts: z.string().transform(Number),
});

const OutletImportSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['Retailer', 'Wholesaler']),
});

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    @InjectModel('ImportJob') private importJobModel: Model<ImportJobDocument>,
    @InjectModel('Product') private productModel: Model<any>,
    @InjectModel('Outlet') private outletModel: Model<any>,
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Distributor') private distributorModel: Model<any>,
    @InjectModel('Target') private targetModel: Model<any>,
    @InjectModel('Inventory') private inventoryModel: Model<any>
  ) {}

  async getImportHistory(organizationId: string) {
    const jobs = await this.importJobModel.find({ organizationId }).sort({ createdAt: -1 }).limit(50).exec();
    return jobs.map(job => ({
      id: job._id.toString(),
      organizationId: job.organizationId,
      type: job.type,
      fileName: job.fileName,
      rows: job.rows,
      valid: job.valid,
      invalid: job.invalid,
      status: job.status,
      date: new Date((job as any).createdAt).toLocaleString()
    }));
  }

  async getImportTypes(organizationId: string) {
    const [productsCount, outletsCount, usersCount, distributorsCount, targetsCount, inventoryCount] = await Promise.all([
      this.productModel.countDocuments({ organizationId }),
      this.outletModel.countDocuments({ organizationId }),
      this.userModel.countDocuments({ organizationId }),
      this.distributorModel.countDocuments({ organizationId }),
      this.targetModel.countDocuments({ organizationId }),
      this.inventoryModel.countDocuments({ organizationId })
    ]);

    const getLastImport = async (type: string) => {
      const job = await this.importJobModel.findOne({ organizationId, type, status: 'Completed' }).sort({ createdAt: -1 }).exec();
      return job ? new Date((job as any).createdAt).toLocaleString() : 'Never';
    };

    const [productsLast, outletsLast, usersLast, distributorsLast, targetsLast, inventoryLast] = await Promise.all([
      getLastImport('products'),
      getLastImport('outlets'),
      getLastImport('users'),
      getLastImport('distributors'),
      getLastImport('targets'),
      getLastImport('inventory')
    ]);

    return [
      { id: 'products', name: 'Products', icon: '📦', count: productsCount, lastImport: productsLast },
      { id: 'outlets', name: 'Outlets', icon: '🏪', count: outletsCount, lastImport: outletsLast },
      { id: 'users', name: 'Users', icon: '👥', count: usersCount, lastImport: usersLast },
      { id: 'distributors', name: 'Distributors', icon: '🏭', count: distributorsCount, lastImport: distributorsLast },
      { id: 'targets', name: 'Targets', icon: '🎯', count: targetsCount, lastImport: targetsLast },
      { id: 'inventory', name: 'Inventory', icon: '📋', count: inventoryCount, lastImport: inventoryLast }
    ];
  }

  async uploadData(organizationId: string, type: string, fileBuffer: Buffer) {
    this.logger.log(`Processing ${type} import for org ${organizationId}`);
    
    if (!fileBuffer) {
      throw new BadRequestException('No file buffer provided');
    }

    // Create an initial job record
    const job = new this.importJobModel({
      organizationId,
      type,
      fileName: `${type}_import_${Date.now()}.csv`,
      status: 'Processing',
    });
    await job.save();

    try {
      const records = await this.parseCSV(fileBuffer);
      this.logger.log(`Parsed ${records.length} records successfully.`);
      
      let validRecords = 0;
      let errors = 0;
      const validDocsToInsert = [];

      for (const record of records) {
        try {
          if (type === 'products') {
            const parsed = ProductImportSchema.parse(record);
            validDocsToInsert.push({
              organizationId,
              name: parsed.name,
              sku: parsed.sku,
              pricing: { mrp: parsed.mrp, basePrice: parsed.pts, pts: parsed.pts, ptr: parsed.mrp },
              status: 'Active'
            });
          } else if (type === 'outlets') {
            const parsed = OutletImportSchema.parse(record);
            validDocsToInsert.push({
              organizationId,
              name: parsed.name,
              code: parsed.code,
              type: parsed.type,
              status: 'Active'
            });
          }
          validRecords++;
        } catch (err) {
          errors++;
        }
      }

      // Perform bulk insert
      if (validDocsToInsert.length > 0) {
        if (type === 'products') {
          await this.productModel.insertMany(validDocsToInsert, { ordered: false });
        } else if (type === 'outlets') {
          await this.outletModel.insertMany(validDocsToInsert, { ordered: false });
        }
      }

      // Update the job record
      job.rows = records.length;
      job.valid = validRecords;
      job.invalid = errors;
      job.status = 'Completed';
      await job.save();

      return {
        success: true,
        recordsProcessed: validRecords,
        errors: errors,
        message: `${type} import completed successfully.`
      };
    } catch (error) {
      this.logger.error(`Import failed: ${(error as Error).message}`);
      job.status = 'Failed';
      job.errorMessage = (error as Error).message;
      await job.save();
      throw new BadRequestException(`Failed to parse CSV file: ${(error as Error).message}`);
    }
  }

  private parseCSV(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      parse(fileBuffer, { columns: true, skip_empty_lines: true }, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });
  }
}
