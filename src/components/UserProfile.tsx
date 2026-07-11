import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, Briefcase, Building, FileText, 
  MapPin, Calendar, Save, RefreshCw, CheckCircle, AlertCircle, 
  Camera, ArrowLeft, Star, Shield, Lock
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { addAuditLog } from '../utils/auditLogger';
import { Language } from '../utils/translations';

interface UserProfileProps {
  language: Language;
  currentUserEmail: string;
  onBack?: () => void;
}

interface ProfileData {
  fullName: string;
  phone: string;
  role: string;
  company: string;
  bio: string;
  location: string;
  avatarId: string;
  updatedAt?: string;
}

const AVATARS = [
  { id: 'av1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', name: 'Executive Teal' },
  { id: 'av2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', name: 'Director Slate' },
  { id: 'av3', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', name: 'Lead Violet' },
  { id: 'av4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', name: 'Partner Indigo' },
  { id: 'av5', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80', name: 'VP Amber' },
  { id: 'av6', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80', name: 'Chief Emerald' },
];

const LOCAL_TRANSLATIONS = {
  en: {
    title: 'Personal Profile Settings',
    subtitle: 'Manage your verified executive credentials and personal details saved in cloud database.',
    fullName: 'Full Name',
    email: 'Email Address (Verified)',
    phone: 'Phone Number',
    jobTitle: 'Job Title / Role',
    company: 'Company / Organization',
    bio: 'Professional Bio',
    location: 'Location / Country',
    avatarSelection: 'Select Executive Avatar',
    saveProfile: 'Save Profile Settings',
    saving: 'Synchronizing with Cloud...',
    savedSuccess: 'Profile successfully synchronized to Cloud Firestore!',
    errorLoading: 'Failed to load cloud profile data. Using local defaults.',
    errorSaving: 'Failed to write data to cloud database.',
    lastSync: 'Last synced with Cloud:',
    goBack: 'Back to Terminal',
    adminAccess: 'Administrator Node',
    executiveAccess: 'Executive Client Node',
    personalData: 'Personal Data',
    syncStatus: 'Cloud Sync Status',
    databaseInfo: 'Secure Firestore Instance',
    activeUser: 'Active Session User',
  },
  ar: {
    title: 'إعدادات الملف الشخصي',
    subtitle: 'إدارة أوراق اعتمادك التنفيذية المعتمدة وتفاصيلك الشخصية المحفوظة في قاعدة البيانات السحابية.',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني (موثق)',
    phone: 'رقم الهاتف',
    jobTitle: 'المسمى الوظيفي / الدور',
    company: 'الشركة / المؤسسة',
    bio: 'السيرة المهنية والنبذة التعريفية',
    location: 'الموقع / الدولة',
    avatarSelection: 'اختر الرمز التعبيري التنفيذي',
    saveProfile: 'حفظ إعدادات الملف الشخصي',
    saving: 'جاري المزامنة مع السحاب...',
    savedSuccess: 'تمت مزامنة الملف الشخصي بنجاح مع Cloud Firestore!',
    errorLoading: 'فشل تحميل بيانات الملف الشخصي السحابي. تم استخدام الإعدادات الافتراضية.',
    errorSaving: 'فشل كتابة البيانات إلى قاعدة البيانات السحابية.',
    lastSync: 'آخر مزامنة سحابية:',
    goBack: 'العودة للوحة التحكم',
    adminAccess: 'عقدة مدير النظام',
    executiveAccess: 'عقدة مستخدم تنفيذي',
    personalData: 'البيانات الشخصية',
    syncStatus: 'حالة المزامنة السحابية',
    databaseInfo: 'قاعدة بيانات Firestore آمنة',
    activeUser: 'المستخدم الحالي للجلسة',
  }
};

export default function UserProfile({ language, currentUserEmail, onBack }: UserProfileProps) {
  const isRTL = language === 'ar';
  const t = LOCAL_TRANSLATIONS[language];

  // Profile fields state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarId, setAvatarId] = useState('av1');

  // Sync statuses
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Determine standard role based on email pattern
  const isUserAdmin = currentUserEmail.toLowerCase().includes('admin') || currentUserEmail === 'admin@sniper.ai';

  // Load from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setErrorMsg('');
      const emailKey = currentUserEmail.toLowerCase().trim();
      const cacheKey = `_user_profile_cache_${emailKey}`;
      try {
        const docRef = doc(db, 'user_profiles', emailKey);
        let docSnap;
        let isOffline = false;
        try {
          docSnap = await getDoc(docRef);
        } catch (getErr: any) {
          const isOfflineError = getErr?.message?.includes('offline') || 
                                 getErr?.message?.includes('Could not reach Cloud Firestore backend') ||
                                 getErr?.code === 'unavailable' ||
                                 getErr?.code === 'failed-precondition';
          if (isOfflineError) {
            isOffline = true;
            console.warn("Firestore offline during UserProfile load. Falling back to local cache.");
          } else {
            handleFirestoreError(getErr, OperationType.GET, `user_profiles/${emailKey}`, currentUserEmail);
          }
        }

        if (docSnap && docSnap.exists()) {
          const data = docSnap.data() as ProfileData;
          setFullName(data.fullName || '');
          setPhone(data.phone || '');
          setRole(data.role || '');
          setCompany(data.company || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          setAvatarId(data.avatarId || 'av1');
          
          // Save to cache
          localStorage.setItem(cacheKey, JSON.stringify(data));

          if (data.updatedAt) {
            setLastSynced(new Date(data.updatedAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }));
          }
        } else {
          // Check if we have a cache
          const cachedStr = localStorage.getItem(cacheKey);
          if (cachedStr) {
            const data = JSON.parse(cachedStr) as ProfileData;
            setFullName(data.fullName || '');
            setPhone(data.phone || '');
            setRole(data.role || '');
            setCompany(data.company || '');
            setBio(data.bio || '');
            setLocation(data.location || '');
            setAvatarId(data.avatarId || 'av1');
            if (data.updatedAt) {
              setLastSynced(new Date(data.updatedAt).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }));
            }
          } else {
            // If profile does not exist in Firestore yet, try loading from local sniper_users storage
            const rawUsers = localStorage.getItem('sniper_users') || '[]';
            const users = JSON.parse(rawUsers);
            const localUser = users.find((u: any) => u.email.toLowerCase() === emailKey);
            if (localUser) {
              setFullName(localUser.name || '');
            }
          }
        }
      } catch (err: any) {
        console.error('Firestore load error:', err);
        setErrorMsg(t.errorLoading);
        // Fallback local storage / cache
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const data = JSON.parse(cachedStr) as ProfileData;
          setFullName(data.fullName || '');
          setPhone(data.phone || '');
          setRole(data.role || '');
          setCompany(data.company || '');
          setBio(data.bio || '');
          setLocation(data.location || '');
          setAvatarId(data.avatarId || 'av1');
        } else {
          const rawUsers = localStorage.getItem('sniper_users') || '[]';
          const users = JSON.parse(rawUsers);
          const localUser = users.find((u: any) => u.email.toLowerCase() === emailKey);
          if (localUser) {
            setFullName(localUser.name || '');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUserEmail) {
      fetchProfile();
    }
  }, [currentUserEmail, language]);

  // Save to Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const emailKey = currentUserEmail.toLowerCase().trim();
      const cacheKey = `_user_profile_cache_${emailKey}`;
      const profilePayload: ProfileData = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        role: role.trim(),
        company: company.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatarId,
        updatedAt: new Date().toISOString()
      };

      // Always save to offline cache first
      localStorage.setItem(cacheKey, JSON.stringify(profilePayload));

      let writeSuccess = true;
      try {
        await setDoc(doc(db, 'user_profiles', emailKey), profilePayload, { merge: true });
      } catch (writeErr: any) {
        const isOfflineError = writeErr?.message?.includes('offline') || 
                               writeErr?.message?.includes('Could not reach Cloud Firestore backend') ||
                               writeErr?.code === 'unavailable' ||
                               writeErr?.code === 'failed-precondition';
        if (isOfflineError) {
          writeSuccess = false;
          console.warn("Firestore offline during UserProfile save. Saved to local cache only.");
        } else {
          handleFirestoreError(writeErr, OperationType.WRITE, `user_profiles/${emailKey}`, currentUserEmail);
        }
      }
      
      // Update local sniper_users to stay in sync
      const rawUsers = localStorage.getItem('sniper_users') || '[]';
      const users = JSON.parse(rawUsers);
      const updatedUsers = users.map((u: any) => {
        if (u.email.toLowerCase() === emailKey) {
          return { ...u, name: fullName.trim() };
        }
        return u;
      });
      localStorage.setItem('sniper_users', JSON.stringify(updatedUsers));

      // Trigger audit log
      addAuditLog(
        currentUserEmail,
        'SECURITY',
        writeSuccess 
          ? `Synchronized profile and personal details to Firestore cloud for: ${emailKey}`
          : `Saved profile and details to offline cache (cloud database currently offline) for: ${emailKey}`,
        'SUCCESS'
      );

      setSuccessMsg(writeSuccess ? t.savedSuccess : (language === 'ar' ? 'تم الحفظ في الذاكرة المؤقتة (قاعدة البيانات غير متصلة بالإنترنت)' : 'Saved profile to local offline cache (Database offline)'));
      setLastSynced(new Date().toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));

      // Auto-hide success
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Firestore save error:', err);
      setErrorMsg(t.errorSaving);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold px-4 py-2 bg-slate-950/60 border border-slate-900 rounded-xl hover:bg-slate-900/60 transition-all cursor-pointer w-fit"
        >
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          <span>{t.goBack}</span>
        </button>
      )}

      {/* Main Container */}
      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative backdrop gradients */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Profile Header Block */}
        <div className="flex flex-col md:flex-row items-center gap-6 pb-6 border-b border-slate-900">
          {/* Avatar frame */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-xl relative shadow-indigo-950/50">
              <img 
                src={selectedAvatar.url} 
                alt="Selected Profile Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex items-center justify-center pointer-events-none">
                <Camera className="w-5 h-5 text-white/75" />
              </div>
            </div>
          </div>

          <div className="text-center md:text-start flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center md:justify-start">
              <h2 className="text-lg font-extrabold font-display text-white tracking-tight">
                {fullName || currentUserEmail.split('@')[0]}
              </h2>
              {isUserAdmin ? (
                <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-lg text-[10px] font-bold w-fit mx-auto md:mx-0">
                  <Shield className="w-3 h-3" />
                  <span>{t.adminAccess}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded-lg text-[10px] font-bold w-fit mx-auto md:mx-0">
                  <Star className="w-3 h-3" />
                  <span>{t.executiveAccess}</span>
                </span>
              )}
            </div>
            
            <p className="text-xs text-slate-400 font-light max-w-xl">
              {t.subtitle}
            </p>

            {lastSynced && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 justify-center md:justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t.lastSync} {lastSynced}</span>
              </div>
            )}
          </div>

          {/* Cloud Info Badge */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 text-start space-y-1.5 w-full md:w-auto shrink-0">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">{t.syncStatus}</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span>{t.databaseInfo}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono font-light mt-1">
              db: {db.app.options.projectId}
            </p>
          </div>
        </div>

        {/* Loader State */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 font-light">{language === 'ar' ? 'جاري استدعاء البيانات الشخصية من السحابة...' : 'Synchronizing profile node metadata...'}</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="pt-6 space-y-6">
            {/* Status indicators */}
            <AnimatePresence>
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{successMsg}</span>
                </motion.div>
              )}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-start">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.fullName}</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: عبد الله السعيد' : 'e.g. Abdullah Al-Saeed'}
                  className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all"
                />
              </div>

              {/* Email (Read-only) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-600" />
                  <span>{t.email}</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={currentUserEmail}
                    className="w-full bg-slate-900 text-slate-500 text-xs px-4 py-3 rounded-xl border border-slate-800 outline-none font-mono cursor-not-allowed"
                  />
                  <span className={`absolute inset-y-0 ${isRTL ? 'left-3.5' : 'right-3.5'} flex items-center`}>
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.phone}</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 50 123 4567"
                  className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all font-mono"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.location}</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={language === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}
                  className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all"
                />
              </div>

              {/* Job Title / Role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.jobTitle}</span>
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder={language === 'ar' ? 'المدير التنفيذي للمبيعات' : 'e.g. Sales Executive Officer'}
                  className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all"
                />
              </div>

              {/* Company */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.company}</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={language === 'ar' ? 'شركة القمة اللوجستية' : 'e.g. Apex Logistics Ltd'}
                  className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all"
                />
              </div>

              {/* Bio (Full row) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{t.bio}</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder={language === 'ar' ? 'اكتب نبذة مهنية مختصرة عن مسؤولياتك وخبراتك...' : 'Describe your operational scope or professional overview...'}
                  className="w-full bg-slate-950 text-white text-xs px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Avatar Picker */}
            <div className="space-y-3 pt-4 border-t border-slate-900 text-start">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                {t.avatarSelection}
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3.5">
                {AVATARS.map((av) => {
                  const isSelected = av.id === avatarId;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarId(av.id)}
                      className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all p-0.5 cursor-pointer hover:scale-105 ${
                        isSelected 
                          ? 'border-indigo-500 shadow-lg shadow-indigo-950/40 bg-indigo-500/10' 
                          : 'border-slate-900 bg-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <img 
                        src={av.url} 
                        alt={av.name} 
                        className="w-full h-full object-cover rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute bottom-1 right-1 bg-indigo-600 text-white p-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3 fill-indigo-600 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form actions */}
            <div className="pt-4 border-t border-slate-900 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg border border-indigo-500/20 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed h-11"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.saving}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t.saveProfile}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
