'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getFirebaseDb, getFirebaseStorage } from '@/lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
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

const step1Schema = z.object({
  clinicName: z.string().min(2, 'Klinika nomi kamida 2 ta belgi'),
  licenseNumber: z.string().min(3, 'Litsenziya raqami kiritilishi shart'),
  licenseExpiry: z.string().min(1, 'Litsenziya muddati kiritilishi shart'),
  region: z.string().min(1, 'Viloyatni tanlang'),
  district: z.string().min(2, 'Tumanni kiriting'),
  address: z.string().min(5, 'To\'liq manzilni kiriting'),
});

const step2Schema = z.object({
  contactPerson: z.string().min(2, 'Mas\'ul shaxs ismini kiriting'),
  phone: z
    .string()
    .min(9, 'Telefon raqamini kiriting')
    .regex(/^\+?[0-9\s\-()]+$/, "Noto'g'ri telefon raqami"),
  doctorCount: z.number().min(0, 'Manfiy bo\'lmasligi kerak'),
  nurseCount: z.number().min(0, 'Manfiy bo\'lmasligi kerak'),
  adminCount: z.number().min(0, 'Manfiy bo\'lmasligi kerak'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

export default function ClinicOnboardingPage() {
  const { user } = useAuth();
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
      toast.error('Kamida bitta mutaxassislikni tanlang');
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
      toast.error('Litsenziya faylini yuklang');
      return;
    }
    if (!sanCertFile) {
      toast.error('Sanitariya sertifikati faylini yuklang');
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

      const clinicData = {
        uid: user.uid,
        email: user.email ?? '',
        displayName: step1Data.clinicName,
        role: 'clinic' as const,
        profileComplete: true,
        createdAt: new Date().toISOString(),
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
        updatedAt: new Date().toISOString(),
      };

      await Promise.all([
        setDoc(doc(getFirebaseDb(), 'clinics', user.uid), clinicData),
        updateDoc(doc(getFirebaseDb(), 'users', user.uid), {
          profileComplete: true,
          displayName: step1Data.clinicName,
          updatedAt: new Date().toISOString(),
        }),
      ]);

      toast.success('Profil muvaffaqiyatli yaratildi!');
      router.replace('/dashboard');
    } catch {
      toast.error('Xato yuz berdi. Qayta urinib ko\'ring');
    } finally {
      setUploading(false);
    }
  }

  const progress = (currentStep / 3) * 100;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Klinika profilini to&apos;ldiring</h1>
        <p className="text-muted-foreground mt-1">Qadam {currentStep} / 3</p>
      </div>
      <Progress value={progress} className="h-2" />

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Asosiy ma'lumotlar</CardTitle>
            <CardDescription>Klinikangiz haqida asosiy ma'lumotlarni kiriting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Klinika nomi</Label>
                <Input placeholder="Klinikangiz to'liq nomi" {...form1.register('clinicName')} />
                {form1.formState.errors.clinicName && (
                  <p className="text-sm text-red-500">{form1.formState.errors.clinicName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Litsenziya raqami</Label>
                <Input placeholder="LTS-12345" {...form1.register('licenseNumber')} />
                {form1.formState.errors.licenseNumber && (
                  <p className="text-sm text-red-500">{form1.formState.errors.licenseNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Litsenziya muddati</Label>
                <Input type="date" {...form1.register('licenseExpiry')} />
                {form1.formState.errors.licenseExpiry && (
                  <p className="text-sm text-red-500">{form1.formState.errors.licenseExpiry.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Viloyat</Label>
                <Select onValueChange={(v: string | null) => { if (v) form1.setValue('region', v); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Viloyatni tanlang" />
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
                <Label>Tuman</Label>
                <Input placeholder="Tuman nomi" {...form1.register('district')} />
                {form1.formState.errors.district && (
                  <p className="text-sm text-red-500">{form1.formState.errors.district.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>To'liq manzil</Label>
                <Input placeholder="Ko'cha, uy raqami" {...form1.register('address')} />
                {form1.formState.errors.address && (
                  <p className="text-sm text-red-500">{form1.formState.errors.address.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full">Davom etish</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Xodimlar va mutaxassisliklar</CardTitle>
            <CardDescription>Klinikangizning xodimlar tarkibi va mutaxassisliklari</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form2.handleSubmit(onStep2Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Mutaxassisliklar</Label>
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
                  <Label>Shifokorlar</Label>
                  <Input type="number" min="0" placeholder="0" {...form2.register('doctorCount', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Hamshiralar</Label>
                  <Input type="number" min="0" placeholder="0" {...form2.register('nurseCount', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Ma'murlar</Label>
                  <Input type="number" min="0" placeholder="0" {...form2.register('adminCount', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mas'ul shaxs (F.I.O.)</Label>
                <Input placeholder="To'liq ism" {...form2.register('contactPerson')} />
                {form2.formState.errors.contactPerson && (
                  <p className="text-sm text-red-500">{form2.formState.errors.contactPerson.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefon raqami</Label>
                <Input placeholder="+998 90 123 45 67" {...form2.register('phone')} />
                {form2.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form2.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep(1)}>
                  Orqaga
                </Button>
                <Button type="submit" className="flex-1">Davom etish</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Hujjatlarni yuklash</CardTitle>
            <CardDescription>Litsenziya va sanitariya sertifikatini PDF formatida yuklang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Litsenziya (PDF)</Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-slate-500"
                onClick={() => licenseRef.current?.click()}
              >
                {licenseFile ? (
                  <p className="text-sm font-medium text-green-600">{licenseFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">PDF faylni tanlash uchun bosing</p>
                    <p className="text-xs text-muted-foreground mt-1">Faqat PDF, max 10MB</p>
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
              <Label>Sanitariya sertifikati (PDF)</Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-slate-500"
                onClick={() => sanCertRef.current?.click()}
              >
                {sanCertFile ? (
                  <p className="text-sm font-medium text-green-600">{sanCertFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">PDF faylni tanlash uchun bosing</p>
                    <p className="text-xs text-muted-foreground mt-1">Faqat PDF, max 10MB</p>
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
                Orqaga
              </Button>
              <Button className="flex-1" onClick={handleFinalSubmit} disabled={uploading}>
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Yuklanmoqda...
                  </span>
                ) : (
                  'Profilni yaratish'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
