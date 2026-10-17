import { useNavigate } from 'react-router-dom';
import {
  Building,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  FileText,
  Globe,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useCompanySettings } from '@/hooks/useSettings';
import settingsBannerBg from '@/Asserts/settings_banner.png';

export function SettingsOverviewPage() {
  const navigate = useNavigate();
  const { data: company } = useCompanySettings();

  return (
    <PageContainer className="pb-24 select-none">
      {/* 1. HERO BANNER (Settings Background Banner with Text) */}
      <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#E2DDD5]/70 bg-[#12100E] h-[135px] sm:h-[155px] md:h-[175px] mb-4 sm:mb-6">
        <img
          src={settingsBannerBg}
          alt="Settings Banner"
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent sm:from-black/80 sm:via-black/35 sm:to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-center h-full p-5 sm:p-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/15 text-[#E5C378] border border-white/20 w-fit mb-2 backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-[#E5C378]" />
            <span>Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-white tracking-wide">
            Settings &amp; Administration
          </h1>
          <p className="text-xs sm:text-sm text-white/85 font-inter mt-1 max-w-[240px] sm:max-w-sm leading-snug">
            Configure entity profile, business credentials, and system preferences.
          </p>
        </div>
      </div>

      {/* 2. SNAPSHOT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {/* Registered Entity */}
        <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between group">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C867E]">
                Registered Entity
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#242424] font-heading truncate mt-0.5 group-hover:text-[#4A0E0E] transition-colors">
                {company?.name || 'Shivarivel Construction & Interiors'}
              </h3>
              <p className="text-xs text-[#6B6B6B] truncate mt-0.5">
                {company?.email || 'Official Registered Entity Record'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8EE] text-[#1E7E34] shrink-0 ml-2">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        </div>

        {/* Administrative Authority */}
        <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex items-start justify-between group">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#8C867E]">
                Administrative Authority
              </span>
              <h3 className="text-sm sm:text-base font-bold text-[#242424] font-heading truncate mt-0.5 group-hover:text-[#B45309] transition-colors">
                {company?.owner_name || 'Owner Administrator'}
              </h3>
              <p className="text-xs text-[#6B6B6B] truncate mt-0.5">
                Full Administrative Ownership &amp; System Access
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F8EE] text-[#1E7E34] shrink-0 ml-2">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        </div>
      </div>

      {/* 3. MAIN ADMINISTRATION SECTION: COMPANY PROFILE CARD */}
      <div className="bg-white border border-[#E8E4DC] rounded-2xl p-4 sm:p-6 shadow-2xs hover:shadow-xs transition-all">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#FBEFEF] text-[#4A0E0E] flex items-center justify-center shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#242424] font-heading truncate">
                  Company Profile
                </h2>
              </div>
              <p className="text-xs text-[#6B6B6B] mt-0.5 line-clamp-1">
                Official entity information, tax identification, and registered corporate contact details.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F8EE] text-[#1E7E34] shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Official Record</span>
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 py-4">
          {/* Registered Address */}
          <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E8E4DC]/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#8C867E]">
              <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
              <span className="font-semibold text-[#8C867E] uppercase text-[10px] tracking-wider">Registered Address</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#242424] line-clamp-2">
              {company?.address || 'Address not specified'}
            </p>
          </div>

          {/* Official Phone */}
          <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E8E4DC]/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#8C867E]">
              <Phone className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
              <span className="font-semibold text-[#8C867E] uppercase text-[10px] tracking-wider">Official Phone</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#242424] font-sans tabular-nums truncate">
              {company?.phone || 'No phone recorded'}
              {company?.alternate_phone ? ` / ${company.alternate_phone}` : ''}
            </p>
          </div>

          {/* Email & Digital Identity */}
          <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E8E4DC]/80 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#8C867E]">
              <Mail className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
              <span className="font-semibold text-[#8C867E] uppercase text-[10px] tracking-wider">Registered Email</span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#242424] truncate">
              {company?.email || 'No email recorded'}
            </p>
          </div>

          {/* GST / Tax ID */}
          {company?.gst_number && (
            <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E8E4DC]/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#8C867E]">
                <FileText className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                <span className="font-semibold text-[#8C867E] uppercase text-[10px] tracking-wider">GST Identification</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#242424] font-sans tabular-nums truncate">
                {company.gst_number}
              </p>
            </div>
          )}

          {/* Website if present */}
          {company?.website && (
            <div className="p-3.5 rounded-xl bg-[#FAFAF8] border border-[#E8E4DC]/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[#8C867E]">
                <Globe className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                <span className="font-semibold text-[#8C867E] uppercase text-[10px] tracking-wider">Official Website</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#242424] truncate">
                {company.website}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Action Footer */}
        <div className="mt-2 pt-4 border-t border-[#F0EAE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-[#8C867E]">
            Primary business details applied automatically to project contracts, reports, and invoices.
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings/company')}
            className="h-10 px-4 rounded-xl bg-[#5A0F12] hover:bg-[#43090B] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>Edit Company Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
