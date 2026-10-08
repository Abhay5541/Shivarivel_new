import { useNavigate } from 'react-router-dom';
import {
  Building,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useCompanySettings } from '@/hooks/useSettings';

export function SettingsOverviewPage() {
  const navigate = useNavigate();
  const { data: company } = useCompanySettings();

  return (
    <PageContainer>
      <PageHeader
        title="Settings & Administration"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F9F3E5] text-[#8F6A18] border border-[#C99A2E]/30">
            <Sparkles className="w-3.5 h-3.5 text-[#C99A2E]" />
            Control Center
          </span>
        }
      />

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-xs flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#4A0E0E]/10 border border-[#4A0E0E]/20 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 sm:w-6 sm:h-6 text-[#4A0E0E]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-[#6B6B6B]">
              Registered Entity
            </span>
            <h3 className="text-sm font-bold text-[#242424] font-heading truncate mt-0.5">
              {company?.name || 'Shivarivel Construction & Interiors'}
            </h3>
            <p className="text-xs text-[#6B6B6B] truncate mt-0.5">
              {company?.email || 'Registered Business Profile'}
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 sm:p-5 shadow-xs flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#C99A2E]/10 border border-[#C99A2E]/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#8F6A18]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-[#6B6B6B]">
              Administrative Authority
            </span>
            <h3 className="text-sm font-bold text-[#242424] font-heading truncate mt-0.5">
              {company?.owner_name || 'Owner Administrator'}
            </h3>
            <p className="text-xs text-[#6B6B6B] truncate mt-0.5">
              Full Administrative Ownership &amp; System Access
            </p>
          </div>
        </div>
      </div>

      {/* Main Administration Section */}
      <div className="space-y-6">
        {/* Company Profile Card */}
        <div className="bg-white border border-[#E2DDD5] rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs hover:border-[#C99A2E]/40 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-start gap-3 sm:gap-4 max-w-2xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#4A0E0E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-[#F9F3E5]" />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-bold text-[#242424] font-heading">
                    Company Profile
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F5F0] text-[#4A0E0E] border border-[#E2DDD5]">
                    Official Entity Record
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Official company identity, registered business address, and primary contact details for Shivarivel Construction &amp; Interiors.
                </p>
                {company && (
                  <div className="pt-2 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-x-5 gap-y-2 text-xs text-[#242424]">
                    <span className="flex items-start sm:items-center gap-1.5 text-[#6B6B6B] min-w-0 max-w-full">
                      <MapPin className="w-3.5 h-3.5 text-[#C99A2E] shrink-0 mt-0.5 sm:mt-0" />
                      <span className="text-[#242424] font-medium break-words sm:truncate sm:max-w-xs">{company.address}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#6B6B6B] shrink-0">
                      <Phone className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                      <span className="text-[#242424] font-medium font-mono">{company.phone}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#6B6B6B] shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[#C99A2E] shrink-0" />
                      <span className="text-[#242424] font-medium">{company.email}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => navigate('/settings/company')}
              className="w-full sm:w-auto gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white shrink-0 justify-center h-11 sm:h-10"
            >
              <span>Edit Company Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
