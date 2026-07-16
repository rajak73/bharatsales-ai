'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for glassmorphic navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glassmorphic py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-saffron-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">BS</span>
              </div>
              <span className={`text-xl font-bold ${scrolled ? 'text-gray-900' : 'text-white'} transition-colors`}>
                BharatSales <span className="text-primary-500">AI</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/features" className={`font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>Features</Link>
              <Link href="/industries" className={`font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>Industries</Link>
              <Link href="/pricing" className={`font-medium transition-colors ${scrolled ? 'text-gray-600 hover:text-primary-600' : 'text-white/80 hover:text-white'}`}>Pricing</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className={`hidden md:block font-semibold transition-colors ${scrolled ? 'text-primary-600 hover:text-primary-700' : 'text-white hover:text-gray-200'}`}>Login</Link>
              <Link href="/login" className="btn-saffron text-sm py-2.5 px-5 shadow-lg shadow-saffron-500/30 hover:scale-105">Start Free Trial</Link>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden gradient-hero animate-gradient">
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-saffron-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-float delay-200"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center px-4 py-2 rounded-full glassmorphic-dark text-white/90 text-sm font-medium mb-8 border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                Trusted by 500+ Indian Distributors
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
                Transform Field Sales with <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-300 to-yellow-200">AI Intelligence</span>
              </h1>
              <p className="text-xl text-white/80 mb-10 max-w-xl font-light leading-relaxed">
                Plan every visit, verify every activity, capture every order, and convert field time into measurable sales growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login" className="btn-saffron text-center text-lg px-8 py-4 shadow-xl shadow-saffron-500/20 hover:-translate-y-1 transition-transform">
                  Start Free 30-Day Trial
                </Link>
                <Link href="/features" className="btn-secondary bg-white/5 border-white/20 text-white hover:bg-white/10 text-center text-lg px-8 py-4 backdrop-blur-sm">
                  Explore Features
                </Link>
              </div>
            </div>

            {/* Floating Dashboard Element */}
            <div className="hidden lg:block animate-fade-in-up delay-300">
              <div className="relative animate-float">
                <div className="glassmorphic rounded-2xl p-6 border-white/30 transform rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                  <div className="bg-white rounded-xl p-6 shadow-inner">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold">R</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">Ravi Kumar</div>
                          <div className="text-xs text-green-600 font-medium flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span> Active in Field
                          </div>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-saffron-100 text-saffron-700 text-xs font-bold rounded-full">Target: 92%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Today's Orders</div>
                        <div className="text-2xl font-bold text-gray-900">₹2.4L</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">Collections</div>
                        <div className="text-2xl font-bold text-gray-900">₹85K</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 font-medium">Beat Compliance</span>
                        <span className="text-green-600 font-bold">14/15 Shops</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]" style={{width: '93%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-6">Powering India's Leading Distributors</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {['Hindustan Unilever', 'Dabur', 'Godrej', 'Marico', 'Emami', 'Patanjali'].map((company) => (
              <div key={company} className="text-gray-600 font-black text-xl hover:text-primary-600 transition-colors cursor-pointer">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Everything You Need to <span className="text-gradient">Supercharge Sales</span></h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">The all-in-one platform bridging the gap between strategy in the boardroom and execution on the street.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📍', title: 'Smart Geofencing', delay: 'delay-100', desc: 'Ensure your reps are actually at the store. Zero fake visits with advanced GPS stamping.' },
              { icon: '🛒', title: 'Lightning Order Engine', delay: 'delay-200', desc: 'Offline-first order booking with automatic scheme applications, GST, and trade discounts.' },
              { icon: '💰', title: 'Credit & Collections', delay: 'delay-300', desc: 'Real-time ledger visibility. Track pending invoices and collect payments securely in the field.' },
              { icon: '🗺️', title: 'Live Map Tracking', delay: 'delay-100', desc: 'Watch your team move in real-time on the manager dashboard map. Optimize routes instantly.' },
              { icon: '🎮', title: 'Target Gamification', delay: 'delay-200', desc: 'Motivate your team with live leaderboards, dynamic target tracking, and milestone achievements.' },
              { icon: '📊', title: 'AI Analytics', delay: 'delay-300', desc: 'Automated DSR generation and predictive insights to highlight at-risk distributors.' }
            ].map((feature) => (
              <div key={feature.title} className={`bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 animate-fade-in-up ${feature.delay}`}>
                <div className="w-14 h-14 bg-primary-50 rounded-xl flex items-center justify-center text-3xl mb-6 shadow-inner">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4 animate-fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-8">Ready to Dominate Your Territory?</h2>
          <p className="text-xl text-white/80 mb-10 font-light">Join the revolution of tech-enabled distribution. Setup takes less than 48 hours.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="bg-white text-primary-700 font-bold text-lg px-10 py-4 rounded-lg shadow-2xl hover:scale-105 transition-transform">Start Free Trial</Link>
            <Link href="/contact" className="glassmorphic text-white font-bold text-lg px-10 py-4 rounded-lg hover:bg-white/20 transition-colors">Book a Demo</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12 border-b border-gray-800 pb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-saffron-500 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">BS</span></div>
                <span className="text-xl font-bold">BharatSales AI</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Built specifically for the unique challenges of Indian distribution. Powerful, offline-first, and highly scalable.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Platform</h4>
              <ul className="space-y-3 text-gray-400 text-sm font-medium">
                <li><Link href="/features" className="hover:text-primary-400 transition-colors">Features & Modules</Link></li>
                <li><Link href="/pricing" className="hover:text-primary-400 transition-colors">Pricing Plans</Link></li>
                <li><Link href="/industries" className="hover:text-primary-400 transition-colors">Industries</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm font-medium">
                <li><Link href="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-primary-400 transition-colors">Contact Sales</Link></li>
                <li><Link href="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-4 text-white">Contact</h4>
              <ul className="space-y-3 text-gray-400 text-sm font-medium">
                <li className="flex items-center"><span className="mr-2">📍</span> Hyderabad, TS, India</li>
                <li className="flex items-center"><span className="mr-2">✉️</span> hello@bharatsales.ai</li>
                <li className="flex items-center"><span className="mr-2">📞</span> 1800-123-4567</li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-500 text-sm font-medium flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <span>© 2026 BharatSales AI. All rights reserved.</span>
            <span>Built with ❤️ for India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
