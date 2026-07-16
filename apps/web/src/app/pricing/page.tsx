import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Simple, <span className="text-gradient">Transparent Pricing</span></h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">Scale your distribution network without worrying about per-transaction fees. Pay per active user.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-100 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
            <p className="text-gray-500 mb-6 h-12">Perfect for small distributors just digitizing their operations.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">₹499</span>
              <span className="text-gray-500">/user/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-gray-700"><span className="text-green-500 mr-2">✔</span> Geofenced Visits</li>
              <li className="flex items-center text-gray-700"><span className="text-green-500 mr-2">✔</span> Basic Order Booking</li>
              <li className="flex items-center text-gray-700"><span className="text-green-500 mr-2">✔</span> Outlet Management</li>
              <li className="flex items-center text-gray-700"><span className="text-green-500 mr-2">✔</span> Standard Support</li>
            </ul>
            <Link href="/login" className="btn-secondary w-full text-center py-3">Start 14-Day Free Trial</Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-primary-900 to-primary-700 rounded-3xl p-8 border border-primary-600 shadow-2xl transform md:-translate-y-4 animate-fade-in-up delay-200 flex flex-col relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-saffron-400 to-saffron-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
            <p className="text-primary-100 mb-6 h-12">Advanced features for growing regional brands.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">₹899</span>
              <span className="text-primary-200">/user/month</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-white"><span className="text-saffron-400 mr-2">✔</span> Everything in Starter</li>
              <li className="flex items-center text-white"><span className="text-saffron-400 mr-2">✔</span> Target Gamification Engine</li>
              <li className="flex items-center text-white"><span className="text-saffron-400 mr-2">✔</span> Collections & Financials</li>
              <li className="flex items-center text-white"><span className="text-saffron-400 mr-2">✔</span> Live Map Tracking</li>
              <li className="flex items-center text-white"><span className="text-saffron-400 mr-2">✔</span> Priority Support</li>
            </ul>
            <Link href="/login" className="btn-saffron w-full text-center py-3 shadow-lg">Start 30-Day Free Trial</Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in-up delay-300 flex flex-col">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
            <p className="text-gray-500 mb-6 h-12">Custom solutions for national FMCG and Pharma players.</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">Custom</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center text-gray-700"><span className="text-primary-600 mr-2">✔</span> Everything in Pro</li>
              <li className="flex items-center text-gray-700"><span className="text-primary-600 mr-2">✔</span> ERP Integrations (Tally, SAP)</li>
              <li className="flex items-center text-gray-700"><span className="text-primary-600 mr-2">✔</span> Dedicated Success Manager</li>
              <li className="flex items-center text-gray-700"><span className="text-primary-600 mr-2">✔</span> Custom BI Dashboards</li>
              <li className="flex items-center text-gray-700"><span className="text-primary-600 mr-2">✔</span> Custom Branding</li>
            </ul>
            <Link href="/contact" className="btn-secondary w-full text-center py-3">Contact Sales</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
