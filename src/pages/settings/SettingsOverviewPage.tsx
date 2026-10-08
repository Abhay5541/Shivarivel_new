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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4A0E0E]/10 border border-[#4A0E0E]/20 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6 text-[#4A0E0E]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-wider font-bold text-[#6B6B6B]">
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

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#C99A2E]/10 border border-[#C99A2E]/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#8F6A18]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-wider font-bold text-[#6B6B6B]">
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
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs hover:border-[#C99A2E]/40 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-12 h-12 rounded-xl bg-[#4A0E0E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building className="w-6 h-6 text-[#F9F3E5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#242424] font-heading">
                    Company Profile &amp; Letterhead
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F5F0] text-[#4A0E0E] border border-[#E2DDD5]">
                    Official Entity Record
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Business identity, official address, and contact numbers used dynamically across
                  printed reports, client estimates, invoice letterheads, and application documents.
                </p>
                {company && (
                  <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#242424]">
                    <span className="flex items-center gap-1.5 text-[#6B6B6B]">
                      <MapPin className="w-3.5 h-3.5 text-[#C99A2E]" />
                      <span className="text-[#242424] font-medium truncate max-w-xs">{company.address}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#6B6B6B]">
                      <Phone className="w-3.5 h-3.5 text-[#C99A2E]" />
                      <span className="text-[#242424] font-medium font-mono">{company.phone}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[#6B6B6B]">
                      <Mail className="w-3.5 h-3.5 text-[#C99A2E]" />
                      <span className="text-[#242424] font-medium">{company.email}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => navigate('/settings/company')}
              className="gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white shrink-0 self-start md:self-center"
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
