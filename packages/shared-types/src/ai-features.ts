export interface AiRecommendationBase {
  modelName: string;
  confidenceScore: number;
  reason: string;
}

export interface ChurnRisk extends AiRecommendationBase {
  outletId: string;
  outletName: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  lastOrderDate?: string;
}

export interface UpsellOpportunity extends AiRecommendationBase {
  outletId: string;
  outletName: string;
  recommendedProducts: string[];
  potentialValue: number;
}

export interface BeatOptimization extends AiRecommendationBase {
  beatId: string;
  beatName: string;
  suggestion: string;
  expectedImpact: string;
}

export interface SalesForecast {
  nextMonthProjectedRevenue: number;
  growthTrend: string;
  confidenceScore: number;
  keyDrivers: string[];
}

export interface AiInsights {
  churnRisks: ChurnRisk[];
  upsellOpportunities: UpsellOpportunity[];
  beatOptimizations: BeatOptimization[];
  salesForecast: SalesForecast;
}
