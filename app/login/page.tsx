'use client';

import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Shield, Users } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const { session, role } = useAuth();

  useEffect(() => {
    // If securely logged in, redirect directly to dashboard avoiding the Auth screen
    if (session) {
      router.push(role === 'staff' ? '/pos' : '/reports');
    }
  }, [session, role, router]);

  useEffect(() => {
    // Quick-fill demo credentials
    setEmail('admin@gmail.com');
    setPassword('');
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg('Sign-in failed: ' + error.message);
      } else {
        // onAuthStateChange handles redirect inside useAuth.tsx
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#011C40', // Brand Deep Blue
        color: '#fff',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Left Decorative Panel ── */}
      <aside style={{
        display: 'none',
        width: '45%',
        background: 'rgba(255, 255, 255, 0.03)', 
        borderRight: '1px solid rgba(255,255,255,0.05)',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="md:flex"
      >
        {/* Glow Effects */}
        <div style={{
          position: 'absolute', top: '10%', left: '10%',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,155,255,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              priority
              style={{ objectFit: 'contain' }}
            />
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.02em' }}>
            Divine Pharmacy Operations
          </span>
        </div>

        {/* Feature Copy */}
        <div style={{ zIndex: 10 }}>
          <h2 style={{
            fontSize: '36px', fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.04em', margin: '0 0 24px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.6) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            maxWidth: '380px',
          }}>
            Every decision matters.<br />Operate with clarity.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              'Real-time inventory precision',
              'Sleek, lightning-fast POS',
              'Compliant performance analytics'
            ].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--accent)', flexShrink: 0,
                  boxShadow: '0 0 10px var(--accent)'
                }} />
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ zIndex: 10 }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
            Pharmacy ERP Authenticated Workspace
          </p>
        </div>
      </aside>

      {/* ── Right Login Form ── */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem 1.5rem', position: 'relative'
      }}>
        {/* Subtle right glow */}
        <div style={{
          position: 'absolute', top: '50%', right: '0', transform: 'translateY(-50%)',
          width: '400px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(59,130,246,0.03) 0%, transparent 60%)',
          pointerEvents: 'none', zIndex: 0
        }} />

        <div style={{ width: '100%', maxWidth: '380px', zIndex: 10 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem' }} className="md:hidden">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              priority
              style={{ objectFit: 'contain' }}
            />
            <span style={{ fontWeight: 800, fontSize: '18px', color: '#fff', letterSpacing: '-0.02em' }}>
              Divine Pharmacy Operations
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', color: '#fff',
              margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              Pharmacy Operations Portal
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>
              Sign in to access your secure pharmacy management system and workspace.
            </p>
          </div>


          {/* Error live region */}
          {errorMsg && (
            <div
              role="alert"
              aria-live="assertive"
              style={{
                marginBottom: '1rem',
                padding: '12px 16px',
                background: 'rgba(196,43,28,0.15)',
                border: '1px solid rgba(196,43,28,0.3)',
                borderRadius: '8px',
                color: '#FCA5A5',
                fontSize: '14px',
                lineHeight: 1.5,
              }}
            >
              {errorMsg}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            noValidate
          >
            {/* Email Input */}
            <div>
              <label
                htmlFor="login-email"
                style={{
                  display: 'block', fontSize: '12px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.75)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '15px', transition: 'border-color 200ms',
                  outline: 'none', minHeight: '52px',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
              />
            </div>

            {/* Password Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label
                  htmlFor="login-password"
                  style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                >
                  Secure Password
                </label>
                <button
                  type="button"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '12px', color: 'var(--accent)', fontWeight: 500, padding: 0
                  }}
                >
                  Forgot details?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  aria-describedby="password-toggle-hint"
                  style={{
                    width: '100%', padding: '14px 16px', paddingRight: '52px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: '15px', transition: 'border-color 200ms', outline: 'none',
                    minHeight: '52px',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                />
                <button
                  type="button"
                  id="password-toggle-hint"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', display: 'flex', padding: '8px',
                    minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >
                  {showPw ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              aria-disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                width: '100%', marginTop: '8px', padding: '16px', borderRadius: '10px',
                background: '#fff', color: '#000', fontSize: '15px', fontWeight: 700,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 200ms',
                boxShadow: '0 4px 14px rgba(255,255,255,0.15)',
                minHeight: 52,
              }}
              onMouseEnter={e => {
                if(!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={e => {
                if(!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,255,255,0.15)';
                }
              }}
            >
              {loading ? (
                <span aria-live="polite">Authenticating...</span>
              ) : (
                <>Sign In to ERP <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" /></>
              )}
            </button>
          </form>



        </div>
      </main>
    </div>
  );
}
