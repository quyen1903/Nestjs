'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoginLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Email and password are required');
      return;
    }

    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      setLocalError(err?.data?.message || 'Login failed');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full"/>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
        <h1 className="text-2xl font-bold">Login</h1>

        {(error || localError) && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error || localError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoginLoading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isLoginLoading ? 'Loading...' : 'Login'}
        </button>

        <p className="text-center text-sm">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-600 hover:underline">
            Register here
          </Link>
        </p>
      </form>
    </main>
  );
}
