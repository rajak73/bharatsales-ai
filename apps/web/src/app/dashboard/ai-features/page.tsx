'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, ArrowRight, BrainCircuit } from 'lucide-react';
import { AiFeaturesService } from '@bharatsales/api-client';
import { AiInsights } from '@bharatsales/shared-types';

export default function AIFeaturesPage() {
  const [insights, setInsights] = useState<AiInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await AiFeaturesService.getInsights('org-1');
      setInsights(data);
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Insights & Forecasting
          </h1>
          <p className="text-gray-500">Machine learning powered predictions and recommendations.</p>
        </div>
        <div className="flex space-x-3">
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold uppercase tracking-wide flex items-center">
            <BrainCircuit className="w-4 h-4 mr-1" />
            Beta
          </span>
        </div>
      </div>

      {loading || !insights ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-gray-500">Analyzing organization data...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Forecast */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TrendingUp className="w-32 h-32" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Sales Forecast (Next 7 Days)
            </h2>
            
            <div className="space-y-6 relative z-10">
              <div>
                <p className="text-sm text-gray-500 mb-1">Expected Revenue (Next Month)</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black text-gray-900">
                    ₹{(insights.salesForecast?.nextMonthProjectedRevenue || 0).toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-green-600 mb-1 bg-green-50 px-2 py-0.5 rounded-md">
                    {insights.salesForecast?.growthTrend || '+0%'} vs last month
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Key Drivers</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {insights.salesForecast?.keyDrivers?.map((driver, idx) => (
                    <span key={idx} className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-xl font-medium text-sm">
                      {driver}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Churn Risk */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Outlet Churn Risk Alerts
            </h2>

            <div className="space-y-4">
              {insights.churnRisks?.map((risk: any) => (
                <div key={risk.outletId} className="p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{risk.outletName}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{risk.outletId}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      risk.riskLevel === 'High' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {risk.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{risk.reason}</p>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                    <button className="text-sm font-medium text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Generate Retention Plan <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2 bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
              <BrainCircuit className="w-64 h-64" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md mb-4 inline-block">
                Field App Integration
              </span>
              <h2 className="text-2xl font-bold mb-4">Smart Recommendations for Reps</h2>
              <p className="text-purple-100 mb-6 leading-relaxed">
                BharatSales AI automatically pushes personalized "Recommended Orders" directly to the Field PWA based on an outlet's past purchasing history, seasonality, and running trade schemes.
              </p>
              <button className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-purple-50 transition-colors">
                Configure AI Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
