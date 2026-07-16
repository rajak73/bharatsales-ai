import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20 animate-fade-in-up">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Unrivaled <span className="text-gradient">Capabilities</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">Explore the modules that make BharatSales AI the most powerful distribution platform in India.</p>
        </div>

        <div className="space-y-32">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up delay-100">
              <div className="text-primary-600 font-bold tracking-widest text-sm uppercase mb-3">Field Force Automation</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Smart Beat Planning & Execution</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Say goodbye to guesswork. Our AI automatically optimizes daily routes based on outstanding collections, past sales volume, and geographical clustering.
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Geofenced Check-ins (Zero fake visits)</li>
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Live Location Tracking on Manager Map</li>
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Offline-first sync engine</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-float">
              <div className="aspect-video bg-gradient-to-tr from-primary-100 to-saffron-100 rounded-xl flex items-center justify-center">
                <span className="text-6xl">🗺️</span>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center flex-col-reverse md:flex-row-reverse">
            <div className="animate-fade-in-up delay-200 md:pl-12">
              <div className="text-saffron-600 font-bold tracking-widest text-sm uppercase mb-3">Sales Motivation</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Target Gamification Engine</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Transform mundane targets into an exciting game. As reps book orders, their progress bars fill up instantly.
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Real-time target vs achievement</li>
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Branch & Zone Leaderboards</li>
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Auto-calculated incentive projections</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-float delay-200">
              <div className="aspect-video bg-gradient-to-tr from-saffron-100 to-yellow-100 rounded-xl flex items-center justify-center">
                <span className="text-6xl">🎮</span>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up delay-300">
              <div className="text-green-600 font-bold tracking-widest text-sm uppercase mb-3">Double-Entry Accounting</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Bulletproof Collections & Credit</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Never lose track of a single rupee. Our financial module handles partial payments, cash, cheques, and credit limits seamlessly.
              </p>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Live ledger visibility in the field</li>
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Overdue invoice locking</li>
                <li className="flex items-center"><span className="text-green-500 mr-3">✔</span> Real-time DSR generation</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 animate-float delay-300">
              <div className="aspect-video bg-gradient-to-tr from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-6xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-32 text-center animate-fade-in-up delay-400">
          <Link href="/pricing" className="btn-primary text-lg px-10 py-4 shadow-xl">See Pricing Plans</Link>
          <div className="mt-4">
            <Link href="/" className="text-primary-600 hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
