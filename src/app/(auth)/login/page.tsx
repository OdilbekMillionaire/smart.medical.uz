'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { loginWithEmail, loginWithGoogle, getGoogleRedirectResult } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { BaseUser } from '@/types';

type LoginFormData = {
  email: string;
  password: string;
};

const TRIAL_MODE_ENABLED =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_DISABLE_TRIAL_MODE !== 'true';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { t } = useLanguage();
  const loginSchema = useMemo(
    () => z.object({
      email: z.string().min(1, t.auth.validation.emailRequired).email(t.auth.validation.emailInvalid),
      password: z.string().min(1, t.auth.validation.passwordRequired),
    }),
    [t]
  );
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Handle redirect result when user returns from Google OAuth
  useEffect(() => {
    async function handleRedirectResult() {
      try {
        const result = await getGoogleRedirectResult();
        if (result?.user) {
          await redirectByRole(result.user.uid);
        }
      } catch (err: unknown) {
        console.error('[Google redirect error]', err);
        const msg = err instanceof Error ? err.message : '';
        toast.error(`${t.auth.googleError}: ${msg}`);
      }
    }
    handleRedirectResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function redirectByRole(uid: string) {
    const snap = await getDoc(doc(getFirebaseDb(), 'users', uid));
    if (!snap.exists()) {
      router.replace('/register');
      return;
    }
    const profile = snap.data() as BaseUser;
    if (!profile.profileComplete) {
      if (profile.role === 'clinic') router.replace('/onboarding/clinic');
      else if (profile.role === 'doctor') router.replace('/onboarding/doctor');
      else if (profile.role === 'patient') router.replace('/onboarding/patient');
      else router.replace('/dashboard');
    } else {
      router.replace('/dashboard');
    }
  }

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    try {
      const result = await loginWithEmail(data.email, data.password);
      await redirectByRole(result.user.uid);
    } catch (err: unknown) {
      console.error('[Email login error]', err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password')) {
        toast.error(t.auth.invalidCredential);
      } else if (msg.includes('user-not-found')) {
        toast.error(t.auth.userNotFound);
      } else if (msg.includes('too-many-requests')) {
        toast.error(t.auth.tooManyRequests);
      } else {
        toast.error(`${t.auth.signInError}: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user) {
        await redirectByRole(result.user.uid);
      }
    } catch (err: unknown) {
      console.error('[Google login error]', err);
      toast.error(`${t.auth.googleError}: ${err instanceof Error ? err.message : err}`);
      setGoogleLoading(false);
    }
  }

  async function enterTrialMode(role: 'admin' | 'clinic' | 'doctor' | 'patient') {
    if (!TRIAL_MODE_ENABLED) {
      toast.error(t.auth.demoModeDisabled);
      return;
    }
    // Sign out any real Firebase user so trial mode takes full effect
    try { const { getFirebaseAuth } = await import('@/lib/firebase'); const { signOut } = await import('firebase/auth'); await signOut(getFirebaseAuth()); } catch { /* ignore */ }
    localStorage.setItem('trial_role', role);
    router.push('/dashboard');
  }

  const TRIAL_ROLES = [
    { role: 'admin'   as const, icon: '🛡️', label: 'Admin' },
    { role: 'clinic'  as const, icon: '🏥', label: 'Klinika' },
    { role: 'doctor'  as const, icon: '👨‍⚕️', label: 'Shifokor' },
    { role: 'patient' as const, icon: '👤', label: 'Foydalanuvchi' },
  ];

  const roleInitials = { admin: 'A', clinic: 'C', doctor: 'D', patient: 'P' } as const;
  const roleLabels = {
    admin: t.auth.roleAdmin,
    clinic: t.auth.roleClinic,
    doctor: t.auth.roleDoctor,
    patient: t.auth.rolePatient,
  } as const;

  return (
    <>
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-end mb-2"><LanguageSwitcher variant="compact" /></div>
        <CardTitle className="text-2xl text-center">{t.auth.signInTitle}</CardTitle>
        <CardDescription className="text-center">{t.auth.signInDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.auth.emailLabel}</Label>
            <Input id="email" type="email" placeholder={t.auth.emailPlaceholder} {...register('email')} />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t.auth.passwordPlaceholder} className="pr-10" {...register('password')} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.auth.signingIn}
              </span>
            ) : t.auth.signIn}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={googleLoading}>
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              {t.auth.signingIn}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t.auth.signInWithGoogle}
            </span>
          )}
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t.auth.noAccount}{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">{t.auth.signUp}</Link>
        </p>
      </CardFooter>
    </Card>

    {TRIAL_MODE_ENABLED && (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-center text-xs font-semibold text-amber-700 uppercase tracking-wider mb-3">
        {t.auth.demoModeTitle}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {TRIAL_ROLES.map(({ role }) => (
          <button
            key={role}
            onClick={() => enterTrialMode(role)}
            className="flex flex-col items-center gap-1 rounded-lg border border-amber-200 bg-white px-2 py-3 text-center hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">{roleInitials[role]}</span>
            <span className="text-xs font-medium text-slate-700">{roleLabels[role]}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-amber-600 mt-2">
        {t.auth.demoModeExitHint}
      </p>
    </div>
    )}
    </>
  );
}
