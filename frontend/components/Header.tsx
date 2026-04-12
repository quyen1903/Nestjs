'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useGetCartQuery } from '@/features/cart/cartApi';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });

  const cartCount = cartData?.metadata?.totalItems || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline">E-Commerce</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className="text-sm text-gray-700 hover:text-indigo-600 transition"
          >
            Home
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-700 hover:text-indigo-600 transition"
          >
            Products
          </Link>

          {/* Auth Links */}
          {isAuthenticated ? (
            <>
              {/* Cart Icon */}
              <Link
                href="/cart"
                className="relative flex items-center text-gray-700 hover:text-indigo-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile Dropdown */}
              <div className="relative group">
                <button className="text-sm text-gray-700 hover:text-indigo-600 transition flex items-center space-x-2">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                </button>

                <div className="absolute right-0 pt-2 hidden group-hover:block">
                  <div className="bg-white rounded-lg shadow-lg border border-slate-200 py-2 min-w-max">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Orders
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm text-gray-700 hover:text-indigo-600 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
