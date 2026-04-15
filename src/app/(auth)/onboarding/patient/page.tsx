'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseDb } from '@/lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
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

const patientSchema = z.object({
  fullName: z.string().min(3, "To'liq ismni kiriting"),
  dob: z.string().min(1, "Tug'ilgan sanani kiriting"),
  gender: z.string().min(1, 'Jinsni tanlang'),
  phone: z
    .string()
    .min(9, 'Telefon raqamini kiriting')
    .regex(/^\+?[0-9\s\-()]+$/, "Noto'g'ri telefon raqami"),
  bloodType: z.string().optional(),
  conditions: z.string().optional(),
  allergies: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

export default function PatientOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<PatientFormData>({ resolver: zodResolver(patientSchema) });

  async function onSubmit(data: PatientFormData) {
    if (!user) return;
    setLoading(true);
    try {
      const patientData = {
        uid: user.uid,
        email: user.email ?? '',
        displayName: data.fullName,
        role: 'patient' as const,
        profileComplete: true,
        createdAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      };

      await Promise.all([
        setDoc(doc(getFirebaseDb(), 'patients', user.uid), patientData),
        updateDoc(doc(getFirebaseDb(), 'users', user.uid), {
          profileComplete: true,
          displayName: data.fullName,
          updatedAt: new Date().toISOString(),
        }),
      ]);

      toast.success('Profil muvaffaqiyatli yaratildi!');
      router.replace('/dashboard');
    } catch {
      toast.error("Xato yuz berdi. Qayta urinib ko'ring");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl text-center">Bemor profilini to&apos;ldiring</CardTitle>
        <CardDescription className="text-center">
          Shaxsiy ma&apos;lumotlaringizni kiriting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>To&apos;liq ism (F.I.O.)</Label>
            <Input placeholder="Abdullayev Alisher Karimovich" {...form.register('fullName')} />
            {form.formState.errors.fullName && (
              <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Tug&apos;ilgan sana</Label>
            <Input type="date" {...form.register('dob')} />
            {form.formState.errors.dob && (
              <p className="text-sm text-red-500">{form.formState.errors.dob.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jinsi</Label>
            <Select onValueChange={(v: string | null) => { if (v) form.setValue('gender', v); }}>
              <SelectTrigger><SelectValue placeholder="Jinsni tanlang" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="erkak">Erkak</SelectItem>
                <SelectItem value="ayol">Ayol</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Telefon raqami</Label>
            <Input placeholder="+998 90 123 45 67" {...form.register('phone')} />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Qon guruhi (ixtiyoriy)</Label>
            <Select onValueChange={(v: string | null) => { if (v) form.setValue('bloodType', v); }}>
              <SelectTrigger><SelectValue placeholder="Qon guruhini tanlang" /></SelectTrigger>
              <SelectContent>
                {['O(I)+', 'O(I)-', 'A(II)+', 'A(II)-', 'B(III)+', 'B(III)-', 'AB(IV)+', 'AB(IV)-'].map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Surunkali kasalliklar (ixtiyoriy)</Label>
            <Textarea
              placeholder="Vergul bilan ajrating: Diabet, Gipertoniya..."
              rows={2}
              {...form.register('conditions')}
            />
          </div>

          <div className="space-y-2">
            <Label>Allergiyalar (ixtiyoriy)</Label>
            <Textarea
              placeholder="Vergul bilan ajrating: Penitsillin, Chang..."
              rows={2}
              {...form.register('allergies')}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saqlanmoqda...
              </span>
            ) : (
              'Profilni yaratish'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
