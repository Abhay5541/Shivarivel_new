import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Watcher } from '@/components/ui/Watcher';
import { LabelInput } from '@/components/ui/LabelInput';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // If already authenticated, redirect
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // ── Auth handler — UNCHANGED logic ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithPassword(email, password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(
        error.message || 'Invalid staff credentials. Please check your email and password.'
      );
    } else {
      navigate(from, { replace: true });
    }
  };

  // ── Card glow micro-interaction ──
  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--glow-x', `${x}%`);
    card.style.setProperty('--glow-y', `${y}%`);
  }, []);

  return (
    <div className="login-page">
      {/* Subtle vignette overlay */}
      <div className="login-vignette" />

      <div className="login-content">
        {/* ── Brand Area ── */}
        <div className="login-brand login-anim-brand">
          <h1 className="login-brand-name">SHIVARIVEL</h1>
          <p className="login-brand-sub">Construction &amp; Interiors</p>
        </div>

        {/* ── Login Card ── */}
        <div
          ref={cardRef}
          className="login-card login-anim-card"
          onMouseMove={handleCardMouseMove}
        >
          {/* Cursor-reactive glow layer */}
          <div className="login-card-glow" />

          {/* Watcher — inside top of sign-in box */}
          <div className="login-card-watcher">
            <Watcher
              follow={60}
              bounce={30}
              size={64}
              shape="Cube"
              eyes="Slant"
            />
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Error state */}
            {errorMessage && (
              <div role="alert" className="login-error">
                {errorMessage}
              </div>
            )}

            {/* Email field */}
            <LabelInput
              field="Email"
              id="staff-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            {/* Password field */}
            <LabelInput
              field="Password"
              id="staff-password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-submit"
            >
              {isLoading && <span className="login-submit-spinner" />}
              <span>Sign In</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
