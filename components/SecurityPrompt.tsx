import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Lock, Shield, Users, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function SecurityPrompt() {
  const { user, verifyPasscode, signOut } = useAuth();
  const router = useRouter();
  const [roleMode, setRoleMode] = useState<'manager' | 'staff'>('manager');
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Default the email to the currently authenticated Supabase user if available
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await verifyPasscode(email, passcode, roleMode);
    if (!res.success) {
      setErrorMsg(res.error || 'Identity verification failed.');
      setLoading(false);
    } else {
      // Identity verified. Redirect based on the chosen role mode
      router.push(roleMode === 'staff' ? '/pos' : '/reports');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(1, 3, 9, 0.92)',
      backdropFilter: 'blur(12px)',
      zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#04091A',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Background */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: '200px', height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none'
        }} />

        {/* Brand/Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Image
            src="/logo.png"
            alt="Logo"
            width={48}
            height={48}
            priority
            style={{ objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Identity Verification
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: 0 }}>
              Access to system requires secure passcode.
            </p>
          </div>
        </div>

        {/* Role Toggle */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '24px',
          background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {(['manager', 'staff'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleMode(r)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: '11px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '13px', transition: 'all 200ms',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                background: roleMode === r ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: roleMode === r ? '#fff' : 'rgba(255,255,255,0.45)',
                boxShadow: roleMode === r ? '0 2px 12px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {r === 'manager' ? <Shield size={14} /> : <Users size={14} />}
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div style={{
            padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px', color: '#F87171', fontSize: '13px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <Lock size={14} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              System Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@divinepharm.com"
              required
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '14px', outline: 'none', transition: 'all 200ms'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
              Verification Passcode
            </label>
            <input
              type="password"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              placeholder="••••"
              required
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '18px', outline: 'none', transition: 'all 200ms',
                letterSpacing: '0.5em', textAlign: 'center'
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '16px', borderRadius: '14px', background: '#fff', color: '#000',
              fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 200ms', marginTop: '12px', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>Verify & Enter ERP <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <button
          onClick={() => signOut()}
          style={{
            width: '100%', background: 'none', border: 'none', padding: '16px 0 0',
            color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer',
            fontWeight: 500, transition: 'color 200ms'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
        >
          Not your account? Sign Out
        </button>
      </div>
    </div>
  );
}
