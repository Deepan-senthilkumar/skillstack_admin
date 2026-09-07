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
    try {
      const user = await api.login(uVal || username, pVal || password);
      if (user.role !== 'STAFF' && !user.is_admin_role) {
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

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg-orb orb-1" />
      <div className="login-bg-orb orb-2" />
      <div className="login-bg-orb orb-3" />

      <div className="login-container">
        {/* Branding */}
        <div className="login-brand">
          <div className="login-logo">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="login-title">Django Kalari</h1>
            <p className="login-subtitle">Admin Control Panel</p>
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
                  placeholder="Enter your username"
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

          {/* Quick Login for Super Admin */}
          <div className="login-quick">
            <p className="quick-label">Quick Login (Demo)</p>
            <div className="quick-btns">
              <button
                className="quick-btn"
                onClick={() => handleLogin('staff', 'Staff@12345')}
                disabled={loading}
              >
                <Shield size={13} /> Super Admin
              </button>
            </div>
          </div>

          <div className="login-notice">
            <Shield size={13} />
            <span>Restricted access — authorised staff only. Student logins are blocked.</span>
          </div>
        </div>

        <p className="login-footer">
          Django Kalari Academy &mdash; Admin Studio &copy; 2026
        </p>
      </div>
    </div>
  );
}
