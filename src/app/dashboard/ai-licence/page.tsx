'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AiLicenceRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/ai-licence'); }, [router]);
  return null;
}
