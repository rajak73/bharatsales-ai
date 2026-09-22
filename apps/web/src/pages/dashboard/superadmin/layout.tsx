import { Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button, EmptyState } from '@bharatsales/ui';
import { useCurrentUser } from '../../../contexts/CurrentUserContext';
import { isPlatformAdmin } from '../../../lib/auth';

export default function SuperAdminLayout() {
  const navigate = useNavigate();
  const user = useCurrentUser();

  if (!isPlatformAdmin(user)) {
    return (
      <EmptyState
        bordered
        icon={<ShieldAlert />}
        title="You don't have access to this page"
        description="Only platform administrators can open the Super Admin section."
        action={<Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>}
      />
    );
  }

  return <Outlet />;
}
