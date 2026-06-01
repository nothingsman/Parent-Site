'use client';

import { useParams } from 'next/navigation';
import { ParentInvitationActivation } from '@/components/auth/ParentInvitationActivation';

export default function CompleteParentInvitationPage() {
  const params = useParams<{ uid: string; token: string }>();
  return <ParentInvitationActivation uid={params?.uid} token={params?.token} />;
}
