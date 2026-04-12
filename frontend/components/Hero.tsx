'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-20">
        <svg
          className="absolute top-0 left-0 w-96 h-96"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="20" cy="30" r="30" />
          <circle cx="70" cy="50" r="40" />
          <circle cx="30" cy="80" r="25" />
        </svg>
        <svg
          className="absolute bottom-0 right-0 w-96 h-96"
          fill="currentColor"
          viewBox="0 0 100 100"
        >
          <circle cx="80" cy="70" r="30" />
          <circle cx="30" cy="50" r="40" />
          <circle cx="70" cy="20" r="25" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="text-indigo-200 font-semibold text-sm mb-4">
            Welcome to E-Commerce
          </p>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Discover Premium Products at Unbeatable Prices
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-indigo-100 mb-8 max-w-xl">
            Shop from thousands of quality products with fast shipping, secure
            payments, and 30-day money-back guarantee.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/"
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition inline-block text-center"
            >
              Start Shopping →
            </Link>
            <Link
              href="#"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition inline-block text-center"
            >
              Learn More
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap gap-8">
            <div>
              <p className="text-3xl font-bold">10k+</p>
              <p className="text-indigo-200">Products</p>
            </div>
            <div>
              <p className="text-3xl font-bold">50k+</p>
              <p className="text-indigo-200">Happy Customers</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/7</p>
              <p className="text-indigo-200">Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1200 120" className="w-full h-auto" preserveAspectRatio="none">
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="white"
          />
        </svg>
      </div>
    </div>
  );
}
