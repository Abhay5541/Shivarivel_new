import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
  ArrowLeft,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  UserCheck,
  Building2,
  Info,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useUsersList,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/useSettings';
import {
  USER_ROLES,
  type UserProfile,
  type UserRole,
} from '@/types/settings';

export function UsersRolesPage() {
  const navigate = useNavigate();
  const { data: users = [], isLoading, isError, refetch } = useUsersList();
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Role Edit Confirmation Modal state
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('supervisor');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status Toggle Modal state
  const [statusToggleUser, setStatusToggleUser] = useState<UserProfile | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter === 'active' && !u.is_active) return false;
      if (statusFilter === 'inactive' && u.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = u.full_name.toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchEmail) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter, search]);

  const handleOpenRoleModal = (user: UserProfile) => {
    setEditingUser(user);
    setSelectedRole(user.role as UserRole);
    setActionError(null);
  };

  const handleConfirmRoleChange = async () => {
    if (!editingUser) return;
    setActionError(null);

    try {
      await updateRoleMutation.mutateAsync({
        userId: editingUser.id,
        newRole: selectedRole,
      });
      setActionSuccess(`Role for ${editingUser.full_name} updated to ${USER_ROLES[selectedRole].label}.`);
      setEditingUser(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user role.');
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusToggleUser) return;
    setActionError(null);

    try {
      const nextStatus = !statusToggleUser.is_active;
      await updateStatusMutation.mutateAsync({
        userId: statusToggleUser.id,
        isActive: nextStatus,
      });
      setActionSuccess(
        `User ${statusToggleUser.full_name} is now ${nextStatus ? 'Active' : 'Inactive'}.`
      );
      setStatusToggleUser(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user status.');
      setStatusToggleUser(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="h-40 flex items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-[#6B6B6B]">
            <RotateCw className="w-5 h-5 animate-spin text-[#C99A2E]" />
            <span>Loading user accounts &amp; permissions...</span>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <div className="bg-[#FDEDEC] border border-[#E02424]/30 rounded-xl p-6 text-center max-w-lg mx-auto my-12">
          <AlertCircle className="w-10 h-10 text-[#E02424] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#242424] font-heading">
            Users could not be loaded
          </h3>
          <p className="text-xs text-[#6B6B6B] mt-1 mb-4">
            Could not fetch application user profiles from the backend repository.
          </p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RotateCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-4">
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#4A0E0E] font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings Overview</span>
        </button>
      </div>

      <PageHeader
        title="Users & Access Roles"
        badge={
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C99A2E]/10 text-[#8F6A18] border border-[#C99A2E]/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Access Control
          </span>
        }
      />

      {/* Success Notification */}
      {actionSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-[#EAF5EE] border border-[#1E6B37]/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#1E6B37] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#1E6B37]">Updated Successfully</h4>
            <p className="text-xs text-[#1E6B37]/90 mt-0.5">{actionSuccess}</p>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-[#1E6B37] hover:text-[#165029] text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Action Error Notification */}
      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-[#FDEDEC] border border-[#E02424]/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E02424] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#E02424]">Action Blocked</h4>
            <p className="text-xs text-[#E02424]/90 mt-0.5">{actionError}</p>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-[#E02424] hover:text-[#9B1C1C] text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Inviting Users Administrative Notice */}
      <div className="bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-[#C99A2E] shrink-0 mt-0.5" />
        <div className="text-xs text-[#6B6B6B] leading-relaxed">
          <strong className="text-[#242424] font-medium block">
            Administrative User Provisioning
          </strong>
          Public signup is disabled by construction security policy. Team members (Supervisors &amp; Admins)
          are provisioned through administrative authentication. Provisioned users appear here for role and status management.
        </div>
      </div>

      {/* Search and Filter Toolbar */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#8C8880] absolute left-3 top-3" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
            <Filter className="w-3.5 h-3.5 text-[#C99A2E]" />
            <span className="font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-9 px-2.5 text-xs bg-white border border-[#E2DDD5] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#C99A2E]"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner / Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="worker">Worker</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
            <span className="font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-2.5 text-xs bg-white border border-[#E2DDD5] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#C99A2E]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="text-xs h-9"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Users Count Summary */}
      <div className="text-xs text-[#6B6B6B] mb-3 px-1 font-medium">
        Showing <strong className="text-[#242424]">{filteredUsers.length}</strong> of{' '}
        <strong className="text-[#242424]">{users.length}</strong> team profile(s)
      </div>

      {/* Desktop Table View (>= 768px) */}
      <div className="hidden md:block bg-white border border-[#E2DDD5] rounded-2xl shadow-xs overflow-hidden mb-6">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E2DDD5] bg-[#F7F5F0]/70 text-[#6B6B6B] font-heading font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">User Details</th>
              <th className="py-3 px-4">Role &amp; Authority</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Assigned Sites</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2DDD5]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#6B6B6B]">
                  <UserCheck className="w-8 h-8 text-[#C99A2E]/50 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#242424]">No users match the selected filters</p>
                  <p className="text-xs mt-1">Try clearing your search query or reset filter settings.</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const roleDef = USER_ROLES[u.role as UserRole] || USER_ROLES.supervisor;
                return (
                  <tr key={u.id} className="hover:bg-[#F7F5F0]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-[#242424]">{u.full_name}</div>
                      <div className="text-[11px] text-[#6B6B6B] font-mono mt-0.5">{u.id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleDef.badgeColor}`}
                      >
                        {roleDef.label}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#242424]">
                        <Phone className="w-3.5 h-3.5 text-[#C99A2E]" />
                        <span className="font-mono">{u.phone || '—'}</span>
                      </div>
                      {u.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#6B6B6B] mt-1">
                          <Mail className="w-3 h-3 text-[#8C8880]" />
                          <span>{u.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EAF5EE] text-[#1E6B37] border border-[#1E6B37]/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5]">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#242424]">
                        <Building2 className="w-3.5 h-3.5 text-[#C99A2E]" />
                        {u.assigned_projects_count ?? 1}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRoleModal(u)}
                        className="text-xs h-8"
                      >
                        Change Role
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setStatusToggleUser(u)}
                        className={`text-xs h-8 ${
                          u.is_active
                            ? 'text-[#E02424] hover:bg-[#FDEDEC]'
                            : 'text-[#1E6B37] hover:bg-[#EAF5EE]'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< 768px, zero overflow at 360px) */}
      <div className="md:hidden space-y-3 mb-6">
        {filteredUsers.length === 0 ? (
          <div className="bg-white border border-[#E2DDD5] rounded-xl p-6 text-center text-[#6B6B6B]">
            <UserCheck className="w-8 h-8 text-[#C99A2E]/50 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#242424]">No users match</p>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const roleDef = USER_ROLES[u.role as UserRole] || USER_ROLES.supervisor;
            return (
              <div
                key={u.id}
                className="bg-white border border-[#E2DDD5] rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#242424]">{u.full_name}</h3>
                    <p className="text-[11px] text-[#6B6B6B] font-mono mt-0.5">{u.id}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${roleDef.badgeColor}`}
                  >
                    {roleDef.label}
                  </span>
                </div>

                <div className="text-xs text-[#242424] space-y-1 pt-1 border-t border-[#E2DDD5]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">Phone:</span>
                    <span className="font-mono font-medium">{u.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6B6B]">Status:</span>
                    <span>
                      {u.is_active ? (
                        <span className="text-[#1E6B37] font-semibold">Active</span>
                      ) : (
                        <span className="text-[#6B6B6B]">Inactive</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#E2DDD5]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenRoleModal(u)}
                    className="flex-1 text-xs h-9"
                  >
                    Change Role
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusToggleUser(u)}
                    className={`flex-1 text-xs h-9 ${
                      u.is_active
                        ? 'text-[#E02424] hover:bg-[#FDEDEC]'
                        : 'text-[#1E6B37] hover:bg-[#EAF5EE]'
                    }`}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Role Change Confirmation Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 modal-backdrop-spring">
          <div className="bg-white rounded-2xl border border-[#E2DDD5] shadow-xl max-w-md w-full p-6 modal-spring space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#242424] font-heading">
                Change Role: {editingUser.full_name}
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-1">
                Select the access level to assign to this team member.
              </p>
            </div>

            <div className="space-y-3">
              {(Object.keys(USER_ROLES) as UserRole[]).map((r) => {
                const def = USER_ROLES[r];
                const isSelected = selectedRole === r;
                return (
                  <div
                    key={r}
                    onClick={() => setSelectedRole(r)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#4A0E0E] bg-[#F7F5F0] ring-1 ring-[#4A0E0E]'
                        : 'border-[#E2DDD5] hover:border-[#C99A2E]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#242424]">{def.label}</span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${def.badgeColor}`}
                      >
                        {def.role}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed">
                      {def.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DDD5]">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
                disabled={updateRoleMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRoleChange}
                disabled={updateRoleMutation.isPending}
                className="gap-2 bg-[#4A0E0E] hover:bg-[#380B0B] text-white"
              >
                {updateRoleMutation.isPending && (
                  <RotateCw className="w-4 h-4 animate-spin text-[#C99A2E]" />
                )}
                <span>Confirm Role</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Status Toggle Confirmation Modal */}
      {statusToggleUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 modal-backdrop-spring">
          <div className="bg-white rounded-2xl border border-[#E2DDD5] shadow-xl max-w-sm w-full p-6 modal-spring space-y-4">
            <h3 className="text-base font-bold text-[#242424] font-heading">
              {statusToggleUser.is_active ? 'Deactivate User?' : 'Activate User?'}
            </h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              {statusToggleUser.is_active
                ? `Deactivating ${statusToggleUser.full_name} will suspend their login access to the ERP. Their historical site reports and records will be preserved.`
                : `Activating ${statusToggleUser.full_name} will restore their login access.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DDD5]">
              <Button
                variant="outline"
                onClick={() => setStatusToggleUser(null)}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusToggle}
                disabled={updateStatusMutation.isPending}
                className={`text-white ${
                  statusToggleUser.is_active
                    ? 'bg-[#E02424] hover:bg-[#C81E1E]'
                    : 'bg-[#1E6B37] hover:bg-[#165029]'
                }`}
              >
                {statusToggleUser.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
