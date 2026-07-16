import Link from 'next/link';

export default function IndustriesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Built for <span className="text-gradient">Indian Industries</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">BharatSales AI is specifically engineered to handle the complex distribution hierarchies found across India's largest sectors.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* FMCG */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-100">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">🧴</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Fast-Moving Consumer Goods (FMCG)</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Handle immense transaction volumes with our offline-first PWA. Manage multi-tier schemes, free goods, and case-level discounts seamlessly.
            </p>
            <ul className="space-y-2 text-gray-700 text-sm font-medium">
              <li>• Automated scheme deductions</li>
              <li>• Primary vs Secondary sales tracking</li>
              <li>• Retailer gamification</li>
            </ul>
          </div>

          {/* Pharma */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-200">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">💊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pharmaceuticals & OTC</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Ensure total compliance. Track batch numbers, expiry dates (FEFO), and medical representative (MR) daily call reporting effortlessly.
            </p>
            <ul className="space-y-2 text-gray-700 text-sm font-medium">
              <li>• Batch-level inventory tracking</li>
              <li>• E-detailing integrations</li>
              <li>• Expiry return management</li>
            </ul>
          </div>

          {/* Agri-Inputs */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-300">
            <div className="w-16 h-16 bg-saffron-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">🌾</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agriculture & Fertilizers</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Equip your field force with tools that work in deep rural areas where internet is non-existent. Sync data when they reach a network zone.
            </p>
            <ul className="space-y-2 text-gray-700 text-sm font-medium">
              <li>• 100% Offline PWA</li>
              <li>• Subsidy tracking (Govt schemas)</li>
              <li>• Dealer network mapping</li>
            </ul>
          </div>

          {/* Building Materials */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-400">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner">🏗️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Paints & Building Materials</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Manage contractor loyalty programs and dynamic credit limits for large wholesale orders, all from a unified dashboard.
            </p>
            <ul className="space-y-2 text-gray-700 text-sm font-medium">
              <li>• Contractor point systems</li>
              <li>• Dynamic outstanding limits</li>
              <li>• Project-based sales tracking</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center">
          <Link href="/contact" className="text-primary-600 font-semibold hover:underline">Don't see your industry? Contact us for a custom use-case assessment →</Link>
        </div>
      </div>
    </div>
  );
}
