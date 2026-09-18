import { useState } from 'react';
import { LogIn, Shield, Eye, EyeOff, AlertCircle, Loader, User } from 'lucide-react';
import { api } from '../api';

export default function AdminLoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (uVal, pVal) => {
    setLoading(true);
    setError('');
    const targetUser = (uVal || username).trim();
    const targetPass = pVal || password;

    if (targetUser === 'demo_admin' || targetUser === 'demo@skillstack.com') {
      try {
        const user = await api.loginDemo();
        onLoginSuccess(user);
        return;
      } catch (err) {
        setError(err.message || 'Demo authentication failed.');
        setLoading(false);
        return;
      }
    }

    try {
      const user = await api.login(targetUser, targetPass);
      const isAuthorized = user && (
        user.role === 'ADMIN' ||
        user.role === 'STAFF' ||
        user.is_admin ||
        user.is_admin_role ||
        user.is_staff ||
        user.is_superuser
      );
      if (!isAuthorized) {
        api.clearTokens();
        setError('Access denied. This panel is for authorised staff and administrators only.');
        setLoading(false);
        return;
      }
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your username and password.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    setUsername('demo@skillstack.com');
    setPassword('demo123');
    try {
      const user = await api.loginDemo();
      onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Demo authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />
      <div className="login-bg-orb orb-3" />

      <div className="login-container">
        {/* Branding */}
        <div className="login-brand">
          <img
            src="/skillstack.png"
            alt="SkillStack Logo"
            style={{
              height: '42px',
              width: 'auto',
              borderRadius: '8px',
              filter: 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.4))'
            }}
          />
          <div>
            <h1 className="login-title">SkillStack</h1>
            <p className="login-subtitle">Admin Command Center</p>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <h2>Staff Sign In</h2>
            <p>Enter your credentials to access the admin studio</p>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="login-field">
              <label htmlFor="admin-username">Username / Email</label>
              <div className="login-input-wrap">
                <User size={16} className="input-icon" />
                <input
                  id="admin-username"
                  type="text"
                  placeholder="admin@skillstack.com"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="admin-password">Password</label>
              <div className="login-input-wrap">
                <LogIn size={16} className="input-icon" />
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="show-pass-btn" onClick={() => setShowPass(s => !s)}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading || !username || !password}
            >
              {loading ? <><Loader size={16} className="spin" /> Authenticating...</> : <><Shield size={16} /> Access Admin Panel</>}
            </button>
          </form>

          {/* 1-Click Demo Admin Access */}
          <div className="demo-login-box" style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(123, 28, 110, 0.06) 0%, rgba(253, 192, 41, 0.08) 100%)',
            border: '1.5px dashed rgba(123, 28, 110, 0.25)',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#7B1C6E' }}>⚡ Quick Demo Admin Access</span>
              <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: '#FDF4FF', color: '#701A75', border: '1px solid #F5D0FE' }}>
                READ-ONLY
              </span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.4, margin: '0 0 12px' }}>
              Explore the entire admin dashboard, question banks, labs, and analytics in safe, view-only mode.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7B1C6E 0%, #A21CAF 100%)',
                color: '#FFFFFF',
                fontSize: '12.5px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(123, 28, 110, 0.25)',
                transition: 'all 0.2s ease'
              }}
            >
              <Shield size={14} /> 1-Click Demo Admin Login
            </button>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#94A3B8' }}>
              Demo Login: <code style={{ color: '#7B1C6E', fontWeight: 700 }}>demo@skillstack.com</code> &bull; Pass: <code style={{ color: '#7B1C6E', fontWeight: 700 }}>demo123</code>
            </div>
          </div>

          <div className="login-notice mt-4">
            <Shield size={13} />
            <span>Restricted access &mdash; Authorized staff & administrators only.</span>
          </div>
        </div>

        <p className="login-footer">
          SkillStack Tutor Platform &mdash; Admin Studio &copy; 2026
        </p>
      </div>
    </div>
  );
}
