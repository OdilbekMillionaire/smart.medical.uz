'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { Edit2, Save, X, RefreshCw, Plus, MapPin, CheckCircle2, UploadCloud, FileText, Loader2 } from 'lucide-react';
import { uploadClinicDocument, uploadDoctorDocument } from '@/lib/storage';

const ClinicLocationPicker = dynamic(
  () => import('@/components/shared/ClinicLocationPicker'),
  { ssr: false, loading: () => <div className="h-[280px] rounded-lg bg-slate-100 animate-pulse" /> }
);

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  clinic: 'bg-blue-100 text-blue-700',
  doctor: 'bg-green-100 text-green-700',
  patient: 'bg-purple-100 text-purple-700',
};

export default function ProfilePage() {
  const { user, userProfile, userRole } = useAuth();
  const { t, lang } = useLanguage();

  const DATE_LOCALE: Record<string, string> = {
    uz: 'uz-UZ', uz_cyrillic: 'uz-UZ', ru: 'ru-RU', en: 'en-US', kk: 'kk-KZ',
  };

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [avatarSeed, setAvatarSeed] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (userProfile) {
      setFormData(userProfile);
    }
  }, [userProfile]);

  if (loading || (!user && loading)) {
    return <div className="p-8 text-center">{t.common.loading}</div>;
  }

  if (!user) {
    return <div className="p-8 text-center">{t.common.error}</div>;
  }

  if (user && !userProfile && !loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pt-12 text-center flex flex-col items-center">
        <h2 className="text-xl font-bold">{t.common.noData}</h2>
        <p className="text-muted-foreground">{t.common.error}</p>
        <Button onClick={() => window.location.href = '/register'} variant="default">
          {t.profile.editTitle}
        </Button>
      </div>
    );
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: t.auth.roleAdmin,
    clinic: t.auth.roleClinic,
    doctor: t.auth.roleDoctor,
    patient: t.auth.rolePatient,
  };

  const displayName = userProfile?.displayName || user?.displayName || user?.email?.split('@')[0] || t.nav.profile;
  const displayPhotoUrl = formData.photoURL || user?.photoURL || (avatarSeed ? `https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}` : undefined);
  const initials = displayName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();

  const profileFields = userProfile ? Object.values(userProfile).filter((v) => v !== null && v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)).length : 0;
  const profileProgress = Math.min(100, Math.round((profileFields / 15) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayAdd = (field: string, value: string) => {
    if (!value.trim()) return;
    const current = Array.isArray(formData[field]) ? formData[field] : [];
    if (!current.includes(value.trim())) {
      setFormData({ ...formData, [field]: [...current, value.trim()] });
    }
  };

  const handleArrayRemove = (field: string, index: number) => {
    const current = Array.isArray(formData[field]) ? formData[field] : [];
    setFormData({ ...formData, [field]: current.filter((_: unknown, i: number) => i !== index) }); // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarSeed(seed);
    setFormData({ ...formData, photoURL: `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}` });
  };

  const handleFileUpload = async (
    file: File,
    docType: 'license' | 'sanCert' | 'diploma' | 'certificate',
    fieldKey: string
  ) => {
    if (!user) return;
    try {
      setUploadProgress((prev) => ({ ...prev, [fieldKey]: 0 }));
      let url: string;
      if (userRole === 'clinic') {
        url = await uploadClinicDocument(user.uid, docType as 'license' | 'sanCert', file, (p) =>
          setUploadProgress((prev) => ({ ...prev, [fieldKey]: p }))
        );
      } else {
        url = await uploadDoctorDocument(user.uid, docType as 'diploma' | 'certificate' | 'license', file, (p) =>
          setUploadProgress((prev) => ({ ...prev, [fieldKey]: p }))
        );
      }
      setFormData((prev) => ({
        ...prev,
        documents: { ...((prev.documents as Record<string, string>) ?? {}), [docType]: url },
      }));
      setUploadProgress((prev) => { const n = { ...prev }; delete n[fieldKey]; return n; });
      toast.success(t.common.success);
    } catch {
      toast.error(t.common.error);
      setUploadProgress((prev) => { const n = { ...prev }; delete n[fieldKey]; return n; });
    }
  };

  const saveChanges = async () => {
    setLoading(true);
    try {
      if (formData.displayName !== user.displayName || formData.photoURL !== user.photoURL) {
        await updateProfile(user, {
          displayName: formData.displayName || formData.fullName || user.displayName,
          photoURL: formData.photoURL || user.photoURL,
        });
      }

      await updateDoc(doc(getFirebaseDb(), 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });

      toast.success(t.common.success);
      setIsEditing(false);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const renderArrayEditor = (fieldKey: string, label: string, placeholder: string) => {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {(formData[fieldKey] || []).map((item: string, i: number) => (
            <Badge key={i} variant="secondary" className="pl-3 pr-1 py-1 flex items-center gap-1">
              {item}
              <button type="button" onClick={() => handleArrayRemove(fieldKey, i)} className="text-slate-500 hover:text-red-500 rounded-full p-0.5"><X className="w-3 h-3"/></button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            id={`new_${fieldKey}`} 
            placeholder={placeholder} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleArrayAdd(fieldKey, e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              const el = document.getElementById(`new_${fieldKey}`) as HTMLInputElement;
              handleArrayAdd(fieldKey, el.value);
              el.value = '';
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.profile.title}</h1>
          <p className="text-sm text-muted-foreground">{t.profile.completion}: {profileProgress}%</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
            <Edit2 className="w-4 h-4" /> {t.common.edit}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => { setIsEditing(false); setFormData(userProfile || {}); }} variant="ghost" disabled={loading}>
              {t.common.cancel}
            </Button>
            <Button onClick={saveChanges} disabled={loading} className="gap-2">
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="w-4 h-4" />}
              {t.common.save}
            </Button>
          </div>
        )}
      </div>

      <Progress value={profileProgress} className="h-2" />

      {/* HEADER CARD */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-slate-50 shadow-sm">
                <AvatarImage src={displayPhotoUrl} />
                <AvatarFallback className="text-3xl font-bold bg-slate-200">{initials}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <button 
                  onClick={generateRandomAvatar}
                  className="absolute bottom-0 right-0 bg-slate-900 text-white rounded-full p-2 shadow-lg hover:bg-slate-800 transition-colors"
                  title={t.profile.randomAvatar}
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 space-y-3 w-full">
              {isEditing ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>{t.profile.displayName}</Label>
                    <Input name="displayName" value={formData.displayName || ''} onChange={handleChange} placeholder={t.profile.displayNamePlaceholder} />
                  </div>
                  <div className="space-y-1">
                    <Label>{t.common.phone}</Label>
                    <Input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+998 90 123 45 67" />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
                    <p className="text-slate-500 font-medium">{formData.phone || user?.email}</p>
                  </div>
                  {userRole && (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm ${ROLE_COLORS[userRole]}`}>
                      {ROLE_LABELS[userRole]}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DOCTOR SPECIFIC */}
      {userRole === 'doctor' && (
        <Card>
          <CardHeader><CardTitle>{t.profile.doctor.fullName}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t.profile.doctor.fullName} ({t.profile.fullNameShort})</Label>
                  <Input name="fullName" value={formData.fullName || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.doctor.specialization}</Label>
                  <Input name="specialization" value={formData.specialization || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.doctor.institution}</Label>
                  <Input name="institution" value={formData.institution || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.doctor.consultFee}</Label>
                  <Input name="consultFee" type="number" value={formData.consultFee || ''} onChange={handleChange} placeholder={t.profile.doctor.consultFeePlaceholder} />
                </div>
                <div className="col-span-2">
                  <Label>{t.profile.doctor.bio}</Label>
                  <Textarea name="bio" value={formData.bio || ''} onChange={handleChange} placeholder={t.profile.doctor.bioPlaceholder} rows={3}/>
                </div>
                <div className="col-span-2">
                  {renderArrayEditor('services', t.profile.doctor.services, t.profile.doctor.servicesPlaceholder)}
                </div>
                {/* DOCUMENT UPLOADS — Doctor */}
                <div className="col-span-2 pt-2 space-y-3">
                  <Label className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-500" /> {t.profile.doctor.certificates}</Label>
                  {(['diploma', 'certificate'] as const).map((docType) => {
                    const labels = { diploma: t.profile.doctor.diplomaFile, certificate: t.profile.doctor.certFile };
                    const existing = (formData.documents as Record<string, string> | undefined)?.[docType];
                    const progress = uploadProgress[docType];
                    return (
                      <div key={docType} className="flex items-center gap-3">
                        <label className="flex-1 flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors">
                          {progress !== undefined ? (
                            <><Loader2 className="w-4 h-4 animate-spin text-blue-500" /><span className="text-sm text-blue-600">{progress}%</span></>
                          ) : (
                            <><UploadCloud className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">{labels[docType]}</span></>
                          )}
                          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, docType, docType); }} />
                        </label>
                        {existing && (
                          <a href={existing} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">{t.common.view}</a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {[
                  { label: t.profile.fullNameShort, value: formData.fullName },
                  { label: t.profile.doctor.specialization, value: formData.specialization },
                  { label: t.profile.doctor.consultFeeLabel, value: formData.consultFee ? `${formData.consultFee} UZS` : null },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value || '-'}</span>
                  </div>
                ))}
                {formData.bio && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground block mb-1">{t.profile.doctor.bioLabel}:</span>
                    <p className="text-sm bg-slate-50 p-3 rounded-lg border">{formData.bio}</p>
                  </div>
                )}
                {formData.services && formData.services.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground block mb-2">{t.profile.doctor.servicesLabel}:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.services.map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-slate-50">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PATIENT SPECIFIC */}
      {userRole === 'patient' && (
        <Card>
          <CardHeader><CardTitle>{t.profile.patient.title}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t.profile.patient.fullName}</Label>
                  <Input name="fullName" value={formData.fullName || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.patient.dob}</Label>
                  <Input name="dob" type="date" value={formData.dob || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.patient.bloodType}</Label>
                  <Input name="bloodType" value={formData.bloodType || ''} onChange={handleChange} placeholder={t.profile.patient.bloodTypePlaceholder} />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.patient.height}</Label>
                  <Input name="height" type="number" value={formData.height || ''} onChange={handleChange} placeholder="175" />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.patient.weight}</Label>
                  <Input name="weight" type="number" value={formData.weight || ''} onChange={handleChange} placeholder="70" />
                </div>
                <div className="col-span-2">
                  {renderArrayEditor('allergies', t.profile.patient.allergies, t.profile.patient.allergiesPlaceholder)}
                </div>
                <div className="col-span-2">
                  {renderArrayEditor('conditions', t.profile.patient.conditionsLabel, t.profile.patient.conditionsPlaceholder)}
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {[
                  { label: t.profile.fullNameShort, value: formData.fullName },
                  { label: t.profile.patient.dob, value: formData.dob ? new Date(formData.dob).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ') : '' },
                  { label: t.profile.patient.bloodType, value: formData.bloodType },
                  { label: t.profile.patient.heightLabel, value: formData.height ? `${formData.height} sm` : '' },
                  { label: t.profile.patient.weightLabel, value: formData.weight ? `${formData.weight} kg` : '' },
                  { label: t.profile.patient.bmi, value: (formData.height && formData.weight) ? (Number(formData.weight) / ((Number(formData.height)/100)**2)).toFixed(1) : '' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value || '-'}</span>
                  </div>
                ))}

                {formData.allergies && formData.allergies.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground block mb-2">{t.profile.patient.allergiesLabel}:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.allergies.map((s: string, i: number) => (
                        <Badge key={i} variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-50">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {formData.conditions && formData.conditions.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground block mb-2">{t.profile.patient.conditionsLabel}:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.conditions.map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CLINIC SPECIFIC */}
      {userRole === 'clinic' && (
        <Card>
          <CardHeader><CardTitle>{t.auth.roleClinic}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>{t.profile.clinic.name}</Label>
                  <Input name="clinicName" value={formData.clinicName || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <Label>{t.profile.clinic.contactPerson}</Label>
                  <Input name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>{t.profile.clinic.address}</Label>
                  <Input name="address" value={formData.address || ''} onChange={handleChange} />
                </div>
                <div className="col-span-2">
                  <Label>{t.profile.clinic.description}</Label>
                  <Textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder={t.profile.clinic.descriptionPlaceholder} rows={3}/>
                </div>
                <div className="col-span-2">
                  {renderArrayEditor('departments', t.profile.clinic.departments, t.profile.clinic.departmentsPlaceholder)}
                </div>
                {/* DOCUMENT UPLOADS — Clinic */}
                <div className="col-span-2 pt-2 space-y-3">
                  <Label className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-500" /> {t.profile.clinic.documents}</Label>
                  {(['license', 'sanCert'] as const).map((docType) => {
                    const labels = { license: t.profile.clinic.licenseFile, sanCert: t.profile.clinic.sanCertFile };
                    const existing = (formData.documents as Record<string, string> | undefined)?.[docType];
                    const progress = uploadProgress[docType];
                    return (
                      <div key={docType} className="flex items-center gap-3">
                        <label className="flex-1 flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors">
                          {progress !== undefined ? (
                            <><Loader2 className="w-4 h-4 animate-spin text-blue-500" /><span className="text-sm text-blue-600">{progress}%</span></>
                          ) : (
                            <><UploadCloud className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-600">{labels[docType]}</span></>
                          )}
                          <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f, docType, docType); }} />
                        </label>
                        {existing && (
                          <a href={existing} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline shrink-0">{t.common.view}</a>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* LOCATION PICKER */}
                <div className="col-span-2 space-y-2 pt-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-green-600" />
                    {t.profile.clinic.mapLocation}
                  </Label>
                  <ClinicLocationPicker
                    lat={formData.lat}
                    lng={formData.lng}
                    onChange={(lat, lng) => setFormData((prev) => ({ ...prev, lat, lng, locationPinned: true }))}
                    onClear={() => setFormData((prev) => ({ ...prev, lat: undefined, lng: undefined, locationPinned: false }))}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {[
                  { label: t.profile.clinic.name, value: formData.clinicName },
                  { label: t.profile.clinic.contactPerson, value: formData.contactPerson },
                  { label: t.profile.clinic.address, value: formData.address },
                  { label: t.profile.clinic.license, value: formData.licenseNumber },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right max-w-[60%]">{value || '-'}</span>
                  </div>
                ))}

                {/* LOCATION STATUS */}
                <div className="flex justify-between text-sm border-b pb-2">
                  <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {t.profile.clinic.mapLocation}</span>
                  {formData.lat && formData.lng ? (
                    <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t.profile.clinic.locationSet}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">{t.profile.clinic.locationNotSet}</span>
                  )}
                </div>

                {formData.description && (
                  <div className="pt-2">
                    <p className="text-sm bg-slate-50 p-3 rounded-lg border">{formData.description}</p>
                  </div>
                )}
                {formData.departments && formData.departments.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sm text-muted-foreground block mb-2">{t.profile.clinic.departmentsLabel}:</span>
                    <div className="flex flex-wrap gap-2">
                      {formData.departments.map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SYSTEM INFO (READONLY) */}
      <Card className="bg-slate-50 shadow-none border-dashed border-slate-200">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">System UID</span>
            <span className="font-mono text-xs">{user?.uid}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t.profile.accountCreated}</span>
            <span className="font-medium">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString(DATE_LOCALE[lang] || 'uz-UZ') : '-'}</span>
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
