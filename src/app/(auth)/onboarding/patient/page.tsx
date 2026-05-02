'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PatientFormData = {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  bloodType?: string;
  conditions?: string;
  allergies?: string;
};

async function requestJson<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export default function PatientOnboardingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const patientSchema = useMemo(
    () => z.object({
      fullName: z.string().min(3, t.common.required),
      dob: z.string().min(1, t.common.required),
      gender: z.string().min(1, t.common.required),
      phone: z
        .string()
        .min(9, t.common.required)
        .regex(/^\+?[0-9\s\-()]+$/, t.common.error),
      bloodType: z.string().optional(),
      conditions: z.string().optional(),
      allergies: z.string().optional(),
    }),
    [t]
  );
  const form = useForm<PatientFormData>({ resolver: zodResolver(patientSchema) });

  async function onSubmit(data: PatientFormData) {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      await requestJson<{ success: boolean }>('/api/onboarding', token, {
        method: 'POST',
        body: JSON.stringify({
          role: 'patient',
          fullName: data.fullName,
          dob: data.dob,
          gender: data.gender,
          phone: data.phone,
          bloodType: data.bloodType ?? null,
          conditions: data.conditions
            ? data.conditions.split(',').map((c) => c.trim()).filter(Boolean)
            : [],
          allergies: data.allergies
            ? data.allergies.split(',').map((a) => a.trim()).filter(Boolean)
            : [],
        }),
      });

      toast.success(t.onboarding.success);
      router.replace('/dashboard');
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t.onboarding.patient.title}</CardTitle>
        <CardDescription className="text-center">
          {t.onboarding.title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>{t.onboarding.patient.fullName}</Label>
            <Input placeholder="Abdullayev Alisher Karimovich" {...form.register('fullName')} />
            {form.formState.errors.fullName && (
              <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.onboarding.patient.dob}</Label>
            <Input type="date" {...form.register('dob')} />
            {form.formState.errors.dob && (
              <p className="text-sm text-red-500">{form.formState.errors.dob.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.onboarding.patient.gender}</Label>
            <Select onValueChange={(v: string | null) => { if (v) form.setValue('gender', v); }}>
              <SelectTrigger><SelectValue placeholder={t.onboarding.patient.gender} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="erkak">{t.onboarding.patient.genderMale}</SelectItem>
                <SelectItem value="ayol">{t.onboarding.patient.genderFemale}</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.onboarding.patient.phone}</Label>
            <Input placeholder="+998 90 123 45 67" {...form.register('phone')} />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t.onboarding.patient.bloodType}</Label>
            <Select onValueChange={(v: string | null) => { if (v) form.setValue('bloodType', v); }}>
              <SelectTrigger><SelectValue placeholder={t.onboarding.patient.bloodType} /></SelectTrigger>
              <SelectContent>
                {['O(I)+', 'O(I)-', 'A(II)+', 'A(II)-', 'B(III)+', 'B(III)-', 'AB(IV)+', 'AB(IV)-'].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t.onboarding.patient.conditions}</Label>
            <Textarea
              placeholder={t.onboarding.patient.conditions}
              rows={2}
              {...form.register('conditions')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.onboarding.patient.allergies}</Label>
            <Textarea
              placeholder={t.onboarding.patient.allergies}
              rows={2}
              {...form.register('allergies')}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t.onboarding.saving}
              </span>
            ) : (
              t.onboarding.save
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
