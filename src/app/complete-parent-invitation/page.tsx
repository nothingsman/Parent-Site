'use client';

import { useSearchParams } from 'next/navigation';
import { ParentInvitationActivation } from '@/components/auth/ParentInvitationActivation';

export default function CompleteParentInvitationPage() {
  const searchParams = useSearchParams();

  return (
    <ParentInvitationActivation
      uid={searchParams.get('uid')}
      token={searchParams.get('token')}
    />
  );
}
