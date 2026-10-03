import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <PageHeader
        title="404 — Page Not Found"
        subtitle="The page or route you are looking for does not exist or may have been moved."
        badge={<Badge variant="accent">Error 404</Badge>}
      />

      <div className="py-12">
        <EmptyState
          icon={<Compass className="w-8 h-8 text-[#4A0E0E]" />}
          title="Route Not Found"
          description="We couldn't find the page you requested. Please verify the URL or return to your operational dashboard."
          actionLabel="Return to Dashboard"
          onAction={() => navigate('/dashboard')}
        />
      </div>
    </PageContainer>
  );
};

export default NotFoundPage;
