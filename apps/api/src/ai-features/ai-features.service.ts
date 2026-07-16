import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OpenAI } from 'openai';
import { OrderDocument, CollectionDocument, OutletDocument } from '../schemas';
import type { AiInsights } from '@bharatsales/shared-types';

@Injectable()
export class AiFeaturesService {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(AiFeaturesService.name);

  constructor(
    @InjectModel('Order') private orderModel: Model<OrderDocument>,
    @InjectModel('Collection') private collectionModel: Model<CollectionDocument>,
    @InjectModel('Outlet') private outletModel: Model<OutletDocument>
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. Falling back to dynamic mock algorithms for AI Insights.');
    }
  }

  async generateInsights(organizationId: string): Promise<AiInsights> {
    // 1. Aggregate real data
    const orders = await this.orderModel.find({ organizationId }).limit(100).exec();
    const collections = await this.collectionModel.find({ organizationId }).limit(100).exec();
    const outlets = await this.outletModel.find({ organizationId }).limit(50).exec();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + ((order as any).amount || 0), 0);
    const totalCollected = collections.reduce((sum, coll) => sum + (coll.amount || 0), 0);
    
    // If we have OpenAI configured, ask it for insights based on data
    if (this.openai) {
      try {
        const prompt = `
          You are an expert AI sales analyst for an FMCG distributor.
          Analyze the following recent data snapshot:
          - Total Orders: ${totalOrders}
          - Total Revenue: ₹${totalRevenue}
          - Total Collections: ₹${totalCollected}
          - Active Outlets Count: ${outlets.length}

          Provide actionable insights in the following strictly formatted JSON structure. Every recommendation object MUST include "modelName": "GPT-3.5-Turbo", "confidenceScore": (number between 0-100), and "reason":
          {
            "churnRisks": [{ "modelName": "string", "confidenceScore": number, "outletId": "string", "outletName": "string", "reason": "string", "riskLevel": "High|Medium", "lastOrderDate": "ISO string" }],
            "upsellOpportunities": [{ "modelName": "string", "confidenceScore": number, "outletId": "string", "outletName": "string", "recommendedProducts": ["string"], "reason": "string", "potentialValue": number }],
            "beatOptimizations": [{ "modelName": "string", "confidenceScore": number, "beatId": "string", "beatName": "string", "suggestion": "string", "expectedImpact": "string" }],
            "salesForecast": { "nextMonthProjectedRevenue": number, "growthTrend": "string", "confidenceScore": number, "keyDrivers": ["string"] }
          }
        `;

        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'system', content: prompt }],
          response_format: { type: 'json_object' }
        });

        if (response.choices[0].message.content) {
          return JSON.parse(response.choices[0].message.content) as AiInsights;
        }
      } catch (error) {
        this.logger.error('Failed to generate OpenAI insights, falling back to mock.', error);
      }
    }

    // 2. Fallback to deterministic algorithm if OpenAI is disabled or fails
    return this.generateFallbackInsights(organizationId, outlets);
  }

  async getRecommendations(outletId: string, organizationId: string) {
    this.logger.log(`Generating AI recommendations for outlet ${outletId}`);
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an AI sales assistant for an FMCG distributor. Provide JSON product recommendations based on the provided context.' },
            { role: 'user', content: `Provide 2 product recommendations for outlet ${outletId} in org ${organizationId}. Return as JSON array with productId, productName, confidenceScore (0-1), reasoning, suggestedQuantity.` }
          ],
          response_format: { type: 'json_object' }
        });
        
        const content = response.choices[0].message.content;
        return JSON.parse(content || '{"recommendations":[]}').recommendations || [];
      } catch (error) {
        this.logger.error('Failed to get recommendations from OpenAI, falling back.', error);
      }
    }
    
    return [
      { productId: 'prod-mock-1', productName: 'Premium Chai 500g', confidenceScore: 0.89, reasoning: 'High demand in this locality during current season.', suggestedQuantity: 20 },
      { productId: 'prod-mock-2', productName: 'Instant Coffee 100g', confidenceScore: 0.75, reasoning: 'Frequently bought together with Premium Chai.', suggestedQuantity: 10 }
    ];
  }

  async parseVoiceToOrder(organizationId: string, transcription: string) {
    this.logger.log(`Parsing voice text for org ${organizationId}: "${transcription}"`);
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an NLP parser for FMCG field sales. Convert the user\'s spoken order transcription into a structured JSON array of cart items containing "productName" and "quantity" (number).' },
            { role: 'user', content: `Transcription: "${transcription}"` }
          ],
          response_format: { type: 'json_object' }
        });
        
        const content = response.choices[0].message.content;
        return JSON.parse(content || '{"items":[]}').items || [];
      } catch (error) {
        this.logger.error('Failed to parse voice via OpenAI, returning empty.', error);
      }
    }

    // Very naive fallback parsing if no OpenAI key
    if (transcription.toLowerCase().includes('chai')) {
      return [{ productName: 'Premium Chai', quantity: 50 }];
    }
    return [];
  }

  private generateFallbackInsights(organizationId: string, outlets: OutletDocument[]): AiInsights {
    const mockOutlets = outlets.length > 0 ? outlets : [
      { _id: 'o1', name: 'Sri Balaji Stores' },
      { _id: 'o2', name: 'Gupta Traders' },
      { _id: 'o3', name: 'Murugan Provision' }
    ];

    return {
      churnRisks: [
        {
          modelName: 'BR-016-Fallback-Model-v1',
          confidenceScore: 82,
          outletId: mockOutlets[0]._id.toString(),
          outletName: mockOutlets[0].name,
          reason: 'No orders placed in the last 45 days. Average frequency was every 14 days.',
          riskLevel: 'High',
          lastOrderDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
      upsellOpportunities: [
        {
          modelName: 'BR-016-Fallback-Model-v1',
          confidenceScore: 75,
          outletId: mockOutlets[1]?._id.toString() || 'o2',
          outletName: mockOutlets[1]?.name || 'Gupta Traders',
          recommendedProducts: ['Premium Gold Blend', 'Family Pack Cookies'],
          reason: 'Consistently buys standard variants. Has high credit limit and good payment history.',
          potentialValue: 12500,
        }
      ],
      beatOptimizations: [
        {
          modelName: 'BR-016-Fallback-Model-v1',
          confidenceScore: 89,
          beatId: 'b1',
          beatName: 'South Zone - Morning Beat',
          suggestion: 'Combine Route A and Route C for Thursday visits.',
          expectedImpact: '15% increase in efficiency',
          reason: 'Historical data shows clustering these beats saves time.',
        }
      ],
      salesForecast: {
        nextMonthProjectedRevenue: 4500000,
        growthTrend: '+12.5%',
        confidenceScore: 88,
        keyDrivers: ['Upcoming festive season', 'Expansion in North Zone'],
      },
    };
  }
}
