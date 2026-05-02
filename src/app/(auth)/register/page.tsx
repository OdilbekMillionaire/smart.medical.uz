'use client';

import { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { registerWithEmail, loginWithGoogle, getGoogleRedirectResult, createUserProfile } from '@/lib/auth';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { getPasswordStrength } from '@/lib/export';
import type { UserRole } from '@/types';

type RegisterFormData = {
  email: string;
  password: string;
  confirmPassword: string;
};

type Step = 'credentials' | 'role';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const registerSchema = useMemo(
    () => z
      .object({
        email: z
          .string()
          .min(1, t.auth.validation.emailRequired)
          .email(t.auth.validation.emailInvalid),
        password: z
          .string()
          .min(8, t.auth.validation.passwordMin),
        confirmPassword: z.string().min(1, t.auth.validation.passwordRequired),
      })
      .refine((d) => d.password === d.confirmPassword, {
        message: t.auth.validation.passwordMatch,
        path: ['confirmPassword'],
      }),
    [t]
  );
  const ROLES: { value: UserRole; label: string; icon: string; description: string }[] = [
    { value: 'clinic', label: t.auth.roleClinic, icon: '🏥', description: t.auth.signUpDesc },
    { value: 'doctor', label: t.auth.roleDoctor, icon: '👨‍⚕️', description: t.auth.signUpDesc },
    { value: 'patient', label: t.auth.rolePatient, icon: '👤', description: t.auth.signUpDesc },
  ];
  const roleInitials = { admin: 'A', clinic: 'C', doctor: 'D', patient: 'P' } as const;
  const roleDescriptions = {
    admin: t.auth.roleAdmin,
    clinic: t.auth.roleClinicDesc,
    doctor: t.auth.roleDoctorDesc,
    patient: t.auth.rolePatientDesc,
  } as const;
  const [step, setStep] = useState<Step>('credentials');
  const [formData, setFormData] = useState<RegisterFormData | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Handle redirect result when user returns from Google OAuth
  useEffect(() => {
    async function handleRedirectResult() {
      try {
        const result = await getGoogleRedirectResult();
        if (!result?.user) return;
        const role = sessionStorage.getItem('google_register_role') as UserRole | null;
        if (!role) { router.replace('/login'); return; }
        sessionStorage.removeItem('google_register_role');
        await createUserProfile(
          result.user.uid,
          result.user.email ?? '',
          result.user.displayName ?? result.user.email?.split('@')[0] ?? '',
          role
        );
        if (role === 'clinic') router.replace('/onboarding/clinic');
        else if (role === 'doctor') router.replace('/onboarding/doctor');
        else router.replace('/onboarding/patient');
      } catch (err: unknown) {
        console.error('[Google register redirect error]', err);
        toast.error(`${t.auth.googleError}: ${err instanceof Error ? err.message : err}`);
      }
    }
    handleRedirectResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const watchedPassword = watch('password', '');

  function onCredentialsSubmit(data: RegisterFormData) {
    setFormData(data);
    setStep('role');
  }

  async function handleRoleConfirm() {
    if (!selectedRole || !formData) return;
    setLoading(true);
    try {
      const result = await registerWithEmail(formData.email, formData.password);
      await createUserProfile(
        result.user.uid,
        formData.email,
        formData.email.split('@')[0],
        selectedRole
      );
      if (selectedRole === 'clinic') router.replace('/onboarding/clinic');
      else if (selectedRole === 'doctor') router.replace('/onboarding/doctor');
      else router.replace('/onboarding/patient');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        toast.error(t.common.error);
        setStep('credentials');
      } else {
        toast.error(t.common.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    if (step === 'credentials') {
      setStep('role');
      return;
    }
    if (!selectedRole) {
      toast.error(t.auth.roleLabel);
      return;
    }
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result?.user) {
        await createUserProfile(
          result.user.uid,
          result.user.email ?? '',
          result.user.displayName ?? result.user.email?.split('@')[0] ?? '',
          selectedRole
        );
        if (selectedRole === 'clinic') router.replace('/onboarding/clinic');
        else if (selectedRole === 'doctor') router.replace('/onboarding/doctor');
        else router.replace('/onboarding/patient');
      }
    } catch (err: unknown) {
      console.error('[Google register error]', err);
      toast.error(`${t.auth.googleError}: ${err instanceof Error ? err.message : err}`);
      setGoogleLoading(false);
    }
  }

  if (step === 'role') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex justify-end"><LanguageSwitcher variant="compact" /></div>
          <CardTitle className="text-2xl text-center">{t.auth.roleLabel}</CardTitle>
          <CardDescription className="text-center">
            {t.auth.signUpDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRole(role.value)}
                className={`flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-colors ${
                  selectedRole === role.value
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-400'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                  {roleInitials[role.value]}
                </span>
                <div>
                  <p className="font-semibold">{role.label}</p>
                  <p className="text-sm text-muted-foreground">{roleDescriptions[role.value]}</p>
                </div>
              </button>
            ))}
          </div>

          {formData ? (
            <Button
              className="w-full"
              disabled={!selectedRole || loading}
              onClick={handleRoleConfirm}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.auth.registeringIn}
                </span>
              ) : (
                t.common.next
              )}
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              disabled={!selectedRole || googleLoading}
              onClick={handleGoogleRegister}
            >
              {googleLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  {t.auth.registeringIn}
                </span>
              ) : (
                t.auth.signInWithGoogle
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setStep('credentials')}
            disabled={loading || googleLoading}
          >
            {t.common.back}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex justify-end"><LanguageSwitcher variant="compact" /></div>
        <CardTitle className="text-2xl text-center">{t.auth.signUp}</CardTitle>
        <CardDescription className="text-center">
          {t.auth.signUpTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t.common.email}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t.auth.emailPlaceholder}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.auth.password}</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder={t.auth.passwordMinPlaceholder} className="pr-10" {...register('password')} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Password strength bar */}
            {watchedPassword.length > 0 && (() => {
              const s = getPasswordStrength(watchedPassword);
              return (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[0,1,2,3].map((i) => (
                      <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i < s.score ? s.color : '#e2e8f0' }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: s.color }}>{s.label}</p>
                </div>
              );
            })()}
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder={t.auth.confirmPasswordPlaceholder} className="pr-10" {...register('confirmPassword')} />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            {t.common.next}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">{t.auth.orContinueWith}</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleRegister}
          disabled={googleLoading}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t.auth.signInWithGoogle}
          </span>
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {t.auth.hasAccount}{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            {t.auth.signIn}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
