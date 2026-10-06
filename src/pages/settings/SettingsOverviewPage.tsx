import { useNavigate } from 'react-router-dom';
import {
  Building,
  ShieldCheck,
  Briefcase,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { useCompanySettings, useUsersList, useServiceTypesAdmin } from '@/hooks/useSettings';

export function SettingsOverviewPage() {
  const navigate = useNavigate();
  const { data: company } = useCompanySettings();
  const { data: users = [] } = useUsersList();
  const { data: serviceTypes = [] } = useServiceTypesAdmin();

  const activeUsersCount = users.filter((u) => u.is_active).length;
  const activeServicesCount = serviceTypes.filter((s) => s.is_active).length;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              GSTIN: <span className="font-mono font-medium">{company?.gst_number || '33AAACS1234F1Z5'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#C99A2E]/10 border border-[#C99A2E]/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-[#8F6A18]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-wider font-bold text-[#6B6B6B]">
              Team &amp; Access
            </span>
            <h3 className="text-xl font-bold text-[#242424] font-heading mt-0.5">
              {activeUsersCount} <span className="text-xs font-normal text-[#6B6B6B]">Active accounts</span>
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {users.length} total provisioned user profile(s)
            </p>
          </div>
        </div>

        <div className="bg-white border border-[#E2DDD5] rounded-xl p-5 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1E6B37]/10 border border-[#1E6B37]/20 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-[#1E6B37]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-wider font-bold text-[#6B6B6B]">
              Master Service Catalog
            </span>
            <h3 className="text-xl font-bold text-[#242424] font-heading mt-0.5">
              {activeServicesCount} <span className="text-xs font-normal text-[#6B6B6B]">Active services</span>
            </h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              {serviceTypes.length} configured service types
            </p>
          </div>
        </div>
      </div>

      {/* Main 3 Administration Sections */}
      <div className="space-y-6">
        {/* Section 1: Company Profile */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs hover:border-[#C99A2E]/40 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-12 h-12 rounded-xl bg-[#4A0E0E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building className="w-6 h-6 text-[#F9F3E5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#242424] font-heading">
                    Company Profile
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F5F0] text-[#4A0E0E] border border-[#E2DDD5]">
                    Single Source of Truth
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Business identity, official address, contact numbers, and GSTIN used dynamically across
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
              <span>Open Company Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Section 2: Users & Roles */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs hover:border-[#C99A2E]/40 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-12 h-12 rounded-xl bg-[#C99A2E] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#242424]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#242424] font-heading">
                    Users &amp; Roles
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20">
                    Role-Based Access
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Manage application team members, designate supervisory site permissions, manage account
                  active states, and preserve primary administrative access rules.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F7F5F0] text-[#242424] font-medium border border-[#E2DDD5]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B37]" />
                    Owner / Admin (Full Access)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F7F5F0] text-[#242424] font-medium border border-[#E2DDD5]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C99A2E]" />
                    Supervisor (Assigned Sites &amp; Muster)
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate('/settings/users')}
              className="gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white shrink-0 self-start md:self-center"
            >
              <span>Manage Users &amp; Roles</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Section 3: Service Types */}
        <div className="bg-white border border-[#E2DDD5] rounded-2xl p-6 shadow-xs hover:border-[#C99A2E]/40 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className="w-12 h-12 rounded-xl bg-[#242424] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase className="w-6 h-6 text-[#F9F3E5]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#242424] font-heading">
                    Service Types
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F9F3E5] text-[#8F6A18] border border-[#C99A2E]/30">
                    Master Catalog
                  </span>
                </div>
                <p className="text-xs text-[#6B6B6B] leading-relaxed">
                  Manage master trade offerings including Civil Contracting, Interior &amp; Woodwork,
                  False Ceiling, 3D Elevation, and Planning approvals consumed across enquiries and projects.
                </p>
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {serviceTypes.slice(0, 4).map((st) => (
                    <span
                      key={st.id}
                      className="px-2 py-0.5 rounded text-[11px] bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5]"
                    >
                      {st.name}
                    </span>
                  ))}
                  {serviceTypes.length > 4 && (
                    <span className="px-2 py-0.5 rounded text-[11px] text-[#6B6B6B] font-medium">
                      +{serviceTypes.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={() => navigate('/settings/service-types')}
              className="gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white shrink-0 self-start md:self-center"
            >
              <span>Manage Service Types</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
