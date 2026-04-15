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

const SPECIALIZATIONS = [
  'Terapevt', 'Jarroh', 'Ginekolog', 'Pediatr', 'Stomatolog',
  'Oftalmolog', 'LOR', 'Kardiolog', 'Nevropatolog', 'Ortoped',
  'Urolog', 'Dermatolog', 'Psixiatr', 'Onkolog', 'Endokrinolog',
];

const step1Schema = z.object({
  fullName: z.string().min(3, 'To\'liq ismni kiriting'),
  specialization: z.string().min(1, 'Mutaxassislikni tanlang'),
  category: z.enum(['first', 'second', 'highest'] as const).refine((v) => v !== undefined, {
    message: 'Malaka toifasini tanlang',
  }),
  diplomaNumber: z.string().min(3, 'Diplom raqamini kiriting'),
  institution: z.string().min(3, 'Muassasa nomini kiriting'),
  certExpiry: z.string().min(1, 'Sertifikat muddatini kiriting'),
  linkedClinicId: z.string().optional(),
  phone: z
    .string()
    .min(9, 'Telefon raqamini kiriting')
    .regex(/^\+?[0-9\s\-()]+$/, "Noto'g'ri telefon raqami"),
});

type Step1Data = z.infer<typeof step1Schema>;

export default function DoctorOnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [diplomaProgress, setDiplomaProgress] = useState(0);
  const [certProgress, setCertProgress] = useState(0);
  const [licenseProgress, setLicenseProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const diplomaRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  const form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

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
        (snap) => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref))
      );
    });
  }

  async function handleFinalSubmit() {
    if (!user || !step1Data) return;
    if (!diplomaFile) { toast.error('Diplom faylini yuklang'); return; }
    if (!certFile) { toast.error('Sertifikat faylini yuklang'); return; }
    if (!licenseFile) { toast.error('Litsenziya faylini yuklang'); return; }

    setUploading(true);
    try {
      const [diplomaUrl, certUrl, licUrl] = await Promise.all([
        uploadFile(diplomaFile, `doctors/${user.uid}/diploma.pdf`, setDiplomaProgress),
        uploadFile(certFile, `doctors/${user.uid}/certificate.pdf`, setCertProgress),
        uploadFile(licenseFile, `doctors/${user.uid}/license.pdf`, setLicenseProgress),
      ]);

      const doctorData = {
        uid: user.uid,
        email: user.email ?? '',
        displayName: step1Data.fullName,
        role: 'doctor' as const,
        profileComplete: true,
        createdAt: new Date().toISOString(),
        fullName: step1Data.fullName,
        specialization: step1Data.specialization,
        category: step1Data.category,
        diplomaNumber: step1Data.diplomaNumber,
        institution: step1Data.institution,
        certExpiry: step1Data.certExpiry,
        linkedClinicId: step1Data.linkedClinicId ?? null,
        phone: step1Data.phone,
        documents: { diploma: diplomaUrl, certificate: certUrl, license: licUrl },
        updatedAt: new Date().toISOString(),
      };

      await Promise.all([
        setDoc(doc(getFirebaseDb(), 'doctors', user.uid), doctorData),
        updateDoc(doc(getFirebaseDb(), 'users', user.uid), {
          profileComplete: true,
          displayName: step1Data.fullName,
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

  const FileUploadArea = ({
    label,
    file,
    inputRef,
    progress,
    onChange,
  }: {
    label: string;
    file: File | null;
    inputRef: React.RefObject<HTMLInputElement>;
    progress: number;
    onChange: (f: File | null) => void;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-5 hover:border-slate-500"
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <p className="text-sm font-medium text-green-600">{file.name}</p>
        ) : (
          <p className="text-sm text-muted-foreground">PDF faylni tanlash uchun bosing</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {progress > 0 && progress < 100 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground">{progress}%</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Shifokor profilini to&apos;ldiring</h1>
        <p className="text-muted-foreground mt-1">Qadam {currentStep} / 2</p>
      </div>
      <Progress value={(currentStep / 2) * 100} className="h-2" />

      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Shaxsiy ma&apos;lumotlar</CardTitle>
            <CardDescription>Shifokor haqida asosiy ma&apos;lumotlar</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((d) => { setStep1Data(d); setCurrentStep(2); })}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>To&apos;liq ism (F.I.O.)</Label>
                <Input placeholder="Abdullayev Alisher Karimovich" {...form.register('fullName')} />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Mutaxassislik</Label>
                <Select onValueChange={(v: string | null) => { if (v) form.setValue('specialization', v); }}>
                  <SelectTrigger><SelectValue placeholder="Mutaxassislikni tanlang" /></SelectTrigger>
                  <SelectContent>
                    {SPECIALIZATIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.specialization && (
                  <p className="text-sm text-red-500">{form.formState.errors.specialization.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Malaka toifasi</Label>
                <Select onValueChange={(v: string | null) => { if (v) form.setValue('category', v as 'first' | 'second' | 'highest'); }}>
                  <SelectTrigger><SelectValue placeholder="Toifani tanlang" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first">Birinchi toifa</SelectItem>
                    <SelectItem value="second">Ikkinchi toifa</SelectItem>
                    <SelectItem value="highest">Oliy toifa</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Diplom raqami</Label>
                <Input placeholder="DPL-123456" {...form.register('diplomaNumber')} />
                {form.formState.errors.diplomaNumber && (
                  <p className="text-sm text-red-500">{form.formState.errors.diplomaNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Muassasa nomi</Label>
                <Input placeholder="Toshkent tibbiyot akademiyasi" {...form.register('institution')} />
                {form.formState.errors.institution && (
                  <p className="text-sm text-red-500">{form.formState.errors.institution.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Sertifikat muddati</Label>
                <Input type="date" {...form.register('certExpiry')} />
                {form.formState.errors.certExpiry && (
                  <p className="text-sm text-red-500">{form.formState.errors.certExpiry.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Klinika (ixtiyoriy)</Label>
                <Input placeholder="Klinika ID raqami (ixtiyoriy)" {...form.register('linkedClinicId')} />
              </div>

              <div className="space-y-2">
                <Label>Telefon raqami</Label>
                <Input placeholder="+998 90 123 45 67" {...form.register('phone')} />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
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
            <CardTitle>Hujjatlarni yuklash</CardTitle>
            <CardDescription>Diplom, sertifikat va litsenziyani PDF formatida yuklang</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploadArea
              label="Diplom (PDF)"
              file={diplomaFile}
              inputRef={diplomaRef}
              progress={diplomaProgress}
              onChange={setDiplomaFile}
            />
            <FileUploadArea
              label="Sertifikat (PDF)"
              file={certFile}
              inputRef={certRef}
              progress={certProgress}
              onChange={setCertFile}
            />
            <FileUploadArea
              label="Litsenziya (PDF)"
              file={licenseFile}
              inputRef={licenseRef}
              progress={licenseProgress}
              onChange={setLicenseFile}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setCurrentStep(1)} disabled={uploading}>
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
