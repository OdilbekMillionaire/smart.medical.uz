'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AiHrRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/ai-hr'); }, [router]);
  return null;
}
