import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Home,
  Sofa,
  Box,
  FileText,
  HardHat,
  Grid,
  Lightbulb,
  Compass,
  Phone,
  MapPin,
  Globe,
  Info,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Watcher } from '@/components/ui/Watcher';
import { LabelInput } from '@/components/ui/LabelInput';
import logoImg from '@/Asserts/shivarivel_svc_logo.png';
import bgImg from '@/Asserts/Background_UI.png';

// 8 Core Services matching Shivarivel Construction Hero Banner Reference UI
const SERVICES = [
  { id: 'building-construction', title: 'Building Construction', icon: Home },
  { id: 'interior-exterior', title: 'Interior & Exterior Works', icon: Sofa },
  { id: '3d-elevation', title: '3D Elevation', icon: Box },
  { id: 'architectural-planning', title: 'Architectural Planning', icon: FileText },
  { id: 'project-management', title: 'Project Management', icon: HardHat },
  { id: 'false-ceiling', title: 'False Ceiling Works', icon: Grid },
  { id: 'profile-light', title: 'Profile Light Work', icon: Lightbulb },
  { id: 'site-surveying', title: 'Site Surveying', icon: Compass },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Redirect if already authenticated
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen relative flex flex-col justify-between overflow-y-auto lg:overflow-hidden font-inter select-none bg-[#071510]">
      {/* 1. BRIGHT, VIVID & WARM BACKGROUND IMAGE (Background_UI.png) */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImg})` }}
      >
        {/* Soft left-side dark vignette for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
      </div>

      {/* 2. MAIN CONTENT AREA — Fits 100% within viewport height on desktop */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-12 py-6 lg:py-4 max-w-[1360px] mx-auto w-full min-h-0">
        {/* DESKTOP SPLIT LAYOUT: LEFT BRANDING & SERVICES + RIGHT LOGIN CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center my-auto py-3 lg:py-0">
          {/* LEFT PANEL: BRAND HEADER, HERO STATEMENT & SERVICES GRID */}
          <div className="lg:col-span-7 space-y-3.5 lg:space-y-4 text-left">
            {/* BRAND HEADER & LOGO */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black shadow-lg">
                <img
                  src={logoImg}
                  alt="Shivarivel Official SVC Logo"
                  className="w-full h-full object-cover scale-[1.14]"
                />
              </div>
              <div className="space-y-0.5">
                <h1 className="font-cinzel text-[22px] sm:text-[26px] font-bold tracking-[0.16em] text-white uppercase leading-tight drop-shadow-lg">
                  SHIVARIVEL
                </h1>
                <p className="font-inter text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.3em] text-[#C9A24A]">
                  CONSTRUCTION &amp; INTERIORS
                </p>
              </div>
            </div>

            {/* HERO STATEMENT */}
            <div className="space-y-1.5 pt-0.5">
              <p className="font-inter text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.3em] text-[#C9A24A]">
                BUILDING DREAMS
              </p>
              <h2 className="font-playfair text-[28px] sm:text-[34px] lg:text-[38px] font-normal text-white leading-[1.12] drop-shadow-md">
                Quality Construction.<br />
                Beautiful Interiors.
              </h2>
              <p className="font-inter text-[12px] sm:text-[13px] text-[#E0E6ED] font-normal leading-relaxed max-w-lg pt-0.5">
                From planning to precision, we deliver spaces that inspire, last and add value.
              </p>
            </div>

            {/* OUR SERVICES SECTION */}
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-3 my-1">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
                <span className="font-inter text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.25em] text-[#C9A24A]">
                  OUR SERVICES
                </span>
                <div className="h-[1px] bg-gradient-to-l from-transparent via-[#C9A24A]/60 to-[#C9A24A]/30 flex-1" />
              </div>

              {/* 4 COLUMNS X 2 ROWS TRANSLUCENT GLASS GRID (COMPACT) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {SERVICES.map((service) => {
                  const Icon = service.icon;
                  return (
                    <div
                      key={service.id}
                      className="group bg-black/50 hover:bg-black/75 border border-[#C9A24A]/60 hover:border-[#C9A24A] backdrop-blur-md rounded-xl p-2.5 flex flex-col items-center justify-center text-center gap-1.5 transition-all duration-200 shadow-xl hover:shadow-[#C9A24A]/30 cursor-default min-h-[64px] sm:min-h-[72px]"
                    >
                      <Icon className="w-5 h-5 text-[#C9A24A] group-hover:scale-110 transition-transform duration-200 shrink-0" />
                      <span className="font-inter text-[10.5px] sm:text-[11px] font-medium text-white leading-tight">
                        {service.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CURSIVE SCRIPT TAGLINE WITH GOLD UNDERLINE FLOURISH */}
              <div className="pt-1.5">
                <p className="font-cursive text-[26px] sm:text-[32px] text-[#C9A24A] tracking-wide text-left drop-shadow-md leading-none">
                  Your Vision . Our Expertise
                </p>
                <div className="w-44 h-[1.5px] bg-gradient-to-r from-[#C9A24A] via-[#C9A24A]/60 to-transparent mt-1" />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: FLOATING CREAM LOGIN CARD (COMPACT VIEWPORT FIT) */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-[#F4F2EC] rounded-[24px] p-5 sm:p-6 lg:p-7 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] text-[#0A1813] border border-white/60 relative overflow-hidden transition-all">
              {/* Card Header with Centered Official Logo */}
              <div className="text-center space-y-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full overflow-hidden flex items-center justify-center bg-black shadow-md">
                  <img
                    src={logoImg}
                    alt="Shivarivel Official Logo"
                    className="w-full h-full object-cover scale-[1.14]"
                  />
                </div>

                <h2 className="font-cinzel text-[19px] sm:text-[21px] font-bold tracking-[0.16em] text-[#0A1813] uppercase mt-1">
                  SHIVARIVEL
                </h2>
                <p className="font-inter text-[9.5px] sm:text-[10px] font-extrabold tracking-[0.25em] text-[#0A1813] uppercase">
                  CONSTRUCTION &amp; INTERIORS
                </p>

                {/* EYE TRACKER (WATCHER) — Scaled for zero-scroll fit */}
                <div
                  className="flex justify-center pt-1.5 pb-0.5"
                  style={{ '--fill-slab': '#FFFFFF', '--fill-on': '#0A1813' } as React.CSSProperties}
                >
                  <Watcher
                    follow={60}
                    bounce={30}
                    size={52}
                    shape="Cube"
                    eyes="Slant"
                  />
                </div>

                <div className="pt-0.5">
                  <h3 className="font-playfair text-[20px] sm:text-[22px] font-semibold text-[#0A1813] leading-tight">
                    Welcome Back!
                  </h3>
                  <p className="font-inter text-[11.5px] text-gray-500 mt-0.5 mb-2.5">
                    Sign in to continue to your account
                  </p>
                </div>
              </div>

              {/* LOGIN FORM */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {errorMessage && (
                  <div className="p-2.5 text-xs bg-red-100 border border-red-300 rounded-xl text-red-800 font-medium flex items-center gap-2">
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Email field with eye-tracking LabelInput */}
                <div className="w-full">
                  <LabelInput
                    field="Email"
                    id="staff-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password field with eye-tracking LabelInput */}
                <div className="w-full">
                  <LabelInput
                    field="Password"
                    id="staff-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {/* REMEMBER ME & FORGOT PASSWORD */}
                <div className="flex items-center justify-between text-[12px] pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#0A1813]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#DFD9CE] text-[#0A1813] focus:ring-[#0A1813] accent-[#0A1813]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-[11.5px] font-medium text-[#4B5563] hover:text-[#0A1813] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* PRIMARY SIGN IN BUTTON */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[44px] bg-[#0A1813] hover:bg-[#152B23] active:bg-[#06120E] text-white font-inter text-[14px] font-semibold rounded-[12px] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-75 tracking-wide mt-2"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 4-COLUMN FOOTER BAR (COMPACT) */}
      <footer className="relative z-10 bg-[#06120E]/90 backdrop-blur-md text-gray-200 py-2 sm:py-2.5 px-4 sm:px-6 lg:px-12 border-t border-[#C9A24A]/30 font-inter text-[11px] font-medium shadow-2xl shrink-0">
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row flex-wrap items-center justify-between gap-2.5 text-center md:text-left">
          {/* Website URL */}
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-[#C9A24A]" />
            <a
              href="https://www.shivarivelconstruction.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              www.shivarivelconstruction.com
            </a>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Contact Numbers */}
          <div className="flex items-center gap-1.5">
            <Phone className="w-3 h-3 text-[#C9A24A]" />
            <span>+91 9443559885 &nbsp;|&nbsp; +91 7339457041</span>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Email Address */}
          <div className="flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-[#C9A24A]" />
            <a
              href="mailto:contact@shivarivelconstruction.com"
              className="hover:text-white transition-colors"
            >
              contact@shivarivelconstruction.com
            </a>
          </div>

          <span className="text-[#C9A24A]/40 hidden md:inline">|</span>

          {/* Office Address */}
          <div className="flex items-center gap-1 text-gray-300">
            <MapPin className="w-3 h-3 text-[#C9A24A] shrink-0" />
            <span className="truncate max-w-xs md:max-w-none">
              22/13, Vellalar East Street, Krishnancoil, Nagercoil, Kanniyakumari - 629001.
            </span>
          </div>
        </div>
      </footer>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#F4F2EC] border border-[#C9A24A]/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-[#0A1813] space-y-4 font-inter">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0A1813]/10 rounded-xl text-[#0A1813]">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold font-playfair text-[#0A1813]">
                Forgot Password Notice
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Public self-service password reset is disabled for security policies. Please contact your company ERP administrator or project engineer:
            </p>
            <div className="p-3 bg-white rounded-xl border border-[#DFD9CE] text-xs space-y-1.5 text-[#0A1813]">
              <p className="font-bold">Er. M. Velmurugan B.E. — 9443559885</p>
              <p className="font-bold">Er. V.A. Manian B.Tech. — 7339457041</p>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-[#0A1813] text-white text-xs font-semibold rounded-xl hover:bg-[#152B23] transition-colors cursor-pointer"
            >
              Understand &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
