import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F5F0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#4A0E0E] flex items-center justify-center text-white font-bold text-xl shadow-md border border-[#C99A2E]/30 tracking-tight">
            SC
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-[#242424] font-heading">
              SHIVARIVEL
            </h2>
            <p className="text-xs text-[#6B6B6B] tracking-wider uppercase font-medium">
              Construction &amp; Interiors
            </p>
          </div>
          <LoadingState message="Verifying session..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
