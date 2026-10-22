'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  return null;
}
