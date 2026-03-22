'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // Redirect to dashboard
        router.push('/');
      } else {
        setError('Invalid password');
      }
    } catch (err) {
      setError('Login failed. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          borderRadius: '16px',
          background: 'rgba(30, 30, 30, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Logo / Title */}
        <div style={{ marginBottom: '32px', textAlign: 'center' }}>
          <div
            style={{
              fontSize: '40px',
              marginBottom: '12px',
            }}
          >
            🐖
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              margin: '0 0 8px 0',
            }}
          >
            Mission Control
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#a0a0a0',
              margin: 0,
            }}
          >
            Secure Dashboard Access
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Password Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter dashboard password"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#ffffff',
              background: '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
              marginBottom: '12px',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#7c3aed';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#8b5cf6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <p
          style={{
            fontSize: '12px',
            color: '#666666',
            textAlign: 'center',
            margin: '16px 0 0 0',
          }}
        >
          XiaoZhu's Personal Dashboard
        </p>
      </div>
    </div>
  );
}
