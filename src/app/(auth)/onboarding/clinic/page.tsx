'use client';

import { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getFirebaseStorage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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

const UZBEKISTAN_REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon',
  'Farg\'ona',
  'Namangan',
  'Samarqand',
  'Buxoro',
  'Navoiy',
  'Qashqadaryo',
  'Surxondaryo',
  'Jizzax',
  'Sirdaryo',
  'Xorazm',
  "Qoraqalpog'iston Respublikasi",
];

const SPECIALTIES = [
  'Terapiya',
  'Jarrohlik',
  'Ginekologiya',
  'Pediatriya',
  'Stomatologiya',
  'Ko\'z kasalliklari',
  'Quloq-burun-tomoq',
  'Kardiologiya',
  'Nevrologiya',
  'Ortopediya',
  'Urologiya',
  'Dermatologiya',
  'Psixiatriya',
  'Onkologiya',
  'Endokrinologiya',
];

type Step1Data = {
  clinicName: string;
  licenseNumber: string;
  licenseExpiry: string;
  region: string;
  district: string;
  address: string;
};

type Step2Data = {
  contactPerson: string;
  phone: string;
  doctorCount: number;
  nurseCount: number;
  adminCount: number;
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

export default function ClinicOnboardingPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [sanCertFile, setSanCertFile] = useState<File | null>(null);
  const [licenseProgress, setLicenseProgress] = useState(0);
  const [sanCertProgress, setSanCertProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const licenseRef = useRef<HTMLInputElement>(null);
  const sanCertRef = useRef<HTMLInputElement>(null);

  const step1Schema = useMemo(
    () => z.object({
      clinicName: z.string().min(2, t.common.required),
      licenseNumber: z.string().min(3, t.common.required),
      licenseExpiry: z.string().min(1, t.common.required),
      region: z.string().min(1, t.common.required),
      district: z.string().min(2, t.common.required),
      address: z.string().min(5, t.common.required),
    }),
    [t]
  );
  const step2Schema = useMemo(
    () => z.object({
      contactPerson: z.string().min(2, t.common.required),
      phone: z
        .string()
        .min(9, t.common.required)
        .regex(/^\+?[0-9\s\-()]+$/, t.common.error),
      doctorCount: z.number().min(0, t.common.error),
      nurseCount: z.number().min(0, t.common.error),
      adminCount: z.number().min(0, t.common.error),
    }),
    [t]
  );

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema) as never,
    defaultValues: { doctorCount: 0, nurseCount: 0, adminCount: 0 },
  });

  function toggleSpecialty(s: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function onStep1Submit(data: Step1Data) {
    setStep1Data(data);
    setCurrentStep(2);
  }

  function onStep2Submit(data: Step2Data) {
    if (selectedSpecialties.length === 0) {
      toast.error(t.onboarding.chooseSpecialtyRequired);
      return;
    }
    setStep2Data(data);
    setCurrentStep(3);
  }

  function uploadFile(
    file: File,
    path: string,
    onProgress: (p: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const storageRef = ref(getFirebaseStorage(), path);
      const task = uploadBytesResumable(storageRef, file);
      task.on(
        'state_changed',
        (snap) => {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  async function handleFinalSubmit() {
    if (!user || !step1Data || !step2Data) return;
    if (!licenseFile) {
      toast.error(t.onboarding.licenseFileRequired);
      return;
    }
    if (!sanCertFile) {
      toast.error(t.onboarding.sanCertFileRequired);
      return;
    }

    setUploading(true);
    try {
      const [licenseUrl, sanCertUrl] = await Promise.all([
        uploadFile(
          licenseFile,
          `clinics/${user.uid}/license.pdf`,
          setLicenseProgress
        ),
        uploadFile(
          sanCertFile,
          `clinics/${user.uid}/san-cert.pdf`,
          setSanCertProgress
        ),
      ]);

      const token = await user.getIdToken();
      await requestJson<{ success: boolean }>('/api/onboarding', token, {
        method: 'POST',
        body: JSON.stringify({
          role: 'clinic',
          clinicName: step1Data.clinicName,
          licenseNumber: step1Data.licenseNumber,
          licenseExpiry: step1Data.licenseExpiry,
          address: step1Data.address,
          region: step1Data.region,
          district: step1Data.district,
          specialties: selectedSpecialties,
          doctorCount: step2Data.doctorCount,
          nurseCount: step2Data.nurseCount,
          adminCount: step2Data.adminCount,
          contactPerson: step2Data.contactPerson,
          phone: step2Data.phone,
          documents: { license: licenseUrl, sanCert: sanCertUrl },
        }),
      });

      toast.success(t.onboarding.success);
      router.replace('/dashboard');
    } catch {
      toast.error(t.common.error);
    } finally {
      setUploading(false);
    }
  }

  const progress = (currentStep / 3) * 100;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t.onboarding.clinic.title}</h1>
        <p className="text-muted-foreground mt-1">{t.onboarding.stepLabel} {currentStep} / 3</p>
      </div>
      <Progress value={progress} className="h-2" />

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.onboarding.basicInfo}</CardTitle>
            <CardDescription>{t.onboarding.clinicBasicDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.name}</Label>
                <Input placeholder={t.onboarding.clinic.name} {...form1.register('clinicName')} />
                {form1.formState.errors.clinicName && (
                  <p className="text-sm text-red-500">{form1.formState.errors.clinicName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.license}</Label>
                <Input placeholder="LTS-12345" {...form1.register('licenseNumber')} />
                {form1.formState.errors.licenseNumber && (
                  <p className="text-sm text-red-500">{form1.formState.errors.licenseNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.licenseExpiry}</Label>
                <Input type="date" {...form1.register('licenseExpiry')} />
                {form1.formState.errors.licenseExpiry && (
                  <p className="text-sm text-red-500">{form1.formState.errors.licenseExpiry.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.region}</Label>
                <Select onValueChange={(v: string | null) => { if (v) form1.setValue('region', v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.onboarding.clinic.region} />
                  </SelectTrigger>
                  <SelectContent>
                    {UZBEKISTAN_REGIONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form1.formState.errors.region && (
                  <p className="text-sm text-red-500">{form1.formState.errors.region.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.district}</Label>
                <Input placeholder={t.onboarding.clinic.district} {...form1.register('district')} />
                {form1.formState.errors.district && (
                  <p className="text-sm text-red-500">{form1.formState.errors.district.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.address}</Label>
                <Input placeholder={t.onboarding.clinic.address} {...form1.register('address')} />
                {form1.formState.errors.address && (
                  <p className="text-sm text-red-500">{form1.formState.errors.address.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full">{t.common.next}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.onboarding.staffSpecialties}</CardTitle>
            <CardDescription>{t.onboarding.clinic.specialties}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.specialties}</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSpecialty(s)}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        selectedSpecialties.includes(s)
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t.onboarding.clinic.doctorCount}</Label>
                  <Input type="number" min="0" placeholder="0" {...form2.register('doctorCount', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.clinic.nurseCount}</Label>
                  <Input type="number" min="0" placeholder="0" {...form2.register('nurseCount', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t.onboarding.adminCount}</Label>
                  <Input type="number" min="0" placeholder="0" {...form2.register('adminCount', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.contactPerson}</Label>
                <Input placeholder={t.onboarding.clinic.contactPerson} {...form2.register('contactPerson')} />
                {form2.formState.errors.contactPerson && (
                  <p className="text-sm text-red-500">{form2.formState.errors.contactPerson.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t.onboarding.clinic.phone}</Label>
                <Input placeholder="+998 90 123 45 67" {...form2.register('phone')} />
                {form2.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form2.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep(1)}>
                  {t.common.back}
                </Button>
                <Button type="submit" className="flex-1">{t.common.next}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.onboarding.uploadDocuments}</CardTitle>
            <CardDescription>{t.onboarding.clinicUploadDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>{t.onboarding.licenseFile} (PDF)</Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-slate-500"
                onClick={() => licenseRef.current?.click()}
              >
                {licenseFile ? (
                  <p className="text-sm font-medium text-green-600">{licenseFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{t.onboarding.choosePdf}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.onboarding.pdfOnly}</p>
                  </>
                )}
              </div>
              <input
                ref={licenseRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setLicenseFile(e.target.files?.[0] ?? null)}
              />
              {licenseProgress > 0 && licenseProgress < 100 && (
                <div className="space-y-1">
                  <Progress value={licenseProgress} className="h-1" />
                  <p className="text-xs text-muted-foreground">{licenseProgress}%</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>{t.onboarding.sanCertificateFile} (PDF)</Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-slate-500"
                onClick={() => sanCertRef.current?.click()}
              >
                {sanCertFile ? (
                  <p className="text-sm font-medium text-green-600">{sanCertFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{t.onboarding.choosePdf}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.onboarding.pdfOnly}</p>
                  </>
                )}
              </div>
              <input
                ref={sanCertRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setSanCertFile(e.target.files?.[0] ?? null)}
              />
              {sanCertProgress > 0 && sanCertProgress < 100 && (
                <div className="space-y-1">
                  <Progress value={sanCertProgress} className="h-1" />
                  <p className="text-xs text-muted-foreground">{sanCertProgress}%</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep(2)} disabled={uploading}>
                {t.common.back}
              </Button>
              <Button className="flex-1" onClick={handleFinalSubmit} disabled={uploading}>
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t.onboarding.uploading}
                  </span>
                ) : (
                  t.onboarding.createProfile
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
