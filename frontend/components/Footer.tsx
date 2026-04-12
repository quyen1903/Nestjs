'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-100 mt-20">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">E</span>
              </div>
              <span className="font-bold text-lg">E-Commerce</span>
            </div>
            <p className="text-sm text-slate-400">
              Your trusted online marketplace for quality products.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  Products
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  Track Order
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  Returns
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-400 hover:text-white transition">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-semibold mb-4">Newsletter</h4>
            <p className="text-sm text-slate-400 mb-4">
              Subscribe to get special offers and updates.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 bg-slate-800 text-white text-sm rounded-l border border-slate-700 focus:outline-none focus:border-indigo-600"
              />
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition text-white text-sm font-medium rounded-r">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 py-8">
          {/* Payment Methods */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <span className="text-xs text-slate-400">Accepted Payment Methods:</span>
            <div className="flex space-x-3">
              {['Visa', 'Mastercard', 'PayPal', 'Apple Pay'].map((method) => (
                <div
                  key={method}
                  className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-slate-400">
              © {currentYear} E-Commerce. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-slate-400 hover:text-white transition">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
