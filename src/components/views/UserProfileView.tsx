import React, { useState, useRef, useEffect } from 'react';
import { Role, UserProfile } from '../../types';
import { 
  User, 
  Camera, 
  Upload, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Store, 
  Smartphone, 
  ShoppingBag,
  Sparkles,
  FlaskConical,
  Printer
} from 'lucide-react';
import { getStoredUserProfile, saveStoredUserProfile } from '../../services/storage';
import { saveUserProfileToSupabase, fetchUserProfileFromSupabase } from '../../services/supabaseClient';

interface UserProfileViewProps {
  currentRole: Role;
  operatorName: string;
  onUpdateOperatorName: (newName: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentRole,
  operatorName,
  onUpdateOperatorName,
}) => {
  const [profile, setProfile] = useState<UserProfile>(() => getStoredUserProfile(currentRole));
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load profile from storage on mount / role change, and attempt Supabase sync
  useEffect(() => {
    const stored = getStoredUserProfile(currentRole);
    setProfile(stored);

    // Fetch from Supabase in background
    fetchUserProfileFromSupabase(currentRole).then((remote) => {
      if (remote) {
        setProfile((prev) => ({ ...prev, ...remote }));
        saveStoredUserProfile(remote);
      }
    });
  }, [currentRole]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen de perfil supera los 2MB. Por favor elige una imagen más ligera.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setProfile((prev) => ({ ...prev, avatarUrl: dataUrl }));
        showToast('Foto cargada exitosamente. Presiona "Guardar Perfil" para aplicar.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setProfile((prev) => ({ ...prev, avatarUrl: '' }));
    showToast('Foto de perfil eliminada.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      alert('Por favor ingresa un nombre.');
      return;
    }

    setIsSaving(true);
    const updated: UserProfile = {
      ...profile,
      name: profile.name.trim(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Save locally in localStorage
    saveStoredUserProfile(updated);

    // 2. Update global operator state
    onUpdateOperatorName(updated.name);

    // 3. Sync to Supabase
    await saveUserProfileToSupabase(updated);

    setIsSaving(false);
    showToast('¡Perfil actualizado y sincronizado con éxito!');
  };

  const roleMeta = {
    admin: {
      title: 'Administrador / Dueño',
      color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#ECB769]',
      badge: 'Control Total',
      icon: ShieldCheck,
    },
    cashier: {
      title: 'Cajero de Oficina (Mostrador)',
      color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#ECB769]',
      badge: 'Caja & Mostrador',
      icon: Store,
    },
    field: {
      title: 'Cobrador / Vendedor en Campo',
      color: 'bg-[#FCF9F2] text-[#4E2B01] border-[#ECB769]',
      badge: 'Móvil Escuelas',
      icon: Smartphone,
    },
    client: {
      title: 'Cliente (Catálogo Digital)',
      color: 'bg-[#FCF9F2] text-[#202020] border-[#ECB769]',
      badge: 'Consulta & Cotizaciones',
      icon: ShoppingBag,
    },
    laboratorio: {
      title: 'Laboratorio (Técnico de Revelado & Fotos)',
      color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#4E2B01]',
      badge: 'Laboratorio & Fotos',
      icon: FlaskConical,
    },
    impresor: {
      title: 'Impresor (Órdenes & Escáner)',
      color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#4E2B01]',
      badge: 'Impresión & Escáner',
      icon: Printer,
    },
  }[currentRole] || {
    title: 'Usuario Minifoto',
    color: 'bg-[#FFF3BC] text-[#4E2B01] border-[#ECB769]',
    badge: 'Minifoto',
    icon: Sparkles,
  };

  const RoleIcon = roleMeta.icon;

  return (
    <div className="flex-1 bg-[#FCF9F2] overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-12 font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-[#4E2B01] text-[#FFF3BC] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-in slide-in-from-bottom border-2 border-[#ECB769]">
            <CheckCircle2 className="w-5 h-5 text-[#ECB769] shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#ECB769]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-[#FFF3BC] rounded-2xl shrink-0 border border-[#ECB769]/50">
              <User className="w-7 h-7 text-[#4E2B01]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF3BC] border border-[#ECB769] text-[#4E2B01] text-[10px] font-black uppercase mb-1">
                <span>Gestión de Usuario y Cuenta</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#202020] leading-tight">
                Mi Perfil de Usuario
              </h1>
              <p className="text-xs text-[#202020]/70 mt-0.5 font-medium">
                Actualiza tu fotografía de perfil, datos personales y de contacto para tickets y cotizaciones en Minifoto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 border-[#ECB769] bg-[#FCF9F2] shrink-0">
            <RoleIcon className="w-5 h-5 text-[#4E2B01]" />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Rol Activo</span>
              <span className="text-xs font-black text-[#4E2B01]">{roleMeta.title}</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* FOTO DE PERFIL / AVATAR */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#ECB769]/30 space-y-4">
            <h2 className="text-sm font-black text-[#202020] uppercase tracking-wide flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#4E2B01]" />
              <span>Fotografía de Perfil</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#4E2B01] shadow-md bg-[#FFF3BC]/30 flex items-center justify-center shrink-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-[#4E2B01]/30" />
                      <span className="text-[10px] font-bold mt-1 text-slate-400">Sin foto</span>
                    </div>
                  )}
                </div>

                {/* Quick overlay trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2.5 bg-[#4E2B01] hover:bg-[#202020] text-[#FFF3BC] rounded-full shadow-lg border-2 border-[#ECB769] cursor-pointer transition transform active:scale-95"
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Controls */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#4E2B01] hover:bg-[#202020] active:scale-95 text-[#FFF3BC] text-xs font-bold rounded-xl transition cursor-pointer shadow-xs border border-[#ECB769]/50"
                  >
                    <Upload className="w-4 h-4 text-[#ECB769]" />
                    <span>Subir Foto de mi Dispositivo</span>
                  </button>

                  {profile.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Quitar Foto</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[#202020]/70 max-w-md">
                  Formatos recomendados: JPG, PNG o WebP (hasta 2MB). Esta foto se mostrará en la cabecera y en los tickets del sistema Minifoto.
                </p>
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES Y DE CONTACTO */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#ECB769]/30 space-y-5">
            <h2 className="text-sm font-black text-[#202020] uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4E2B01]" />
              <span>Información Personal & Contacto</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202020] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#4E2B01]" />
                  <span>Nombre Completo / Operador *</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Ej. Uriel Gómez"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202020] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#4E2B01]" />
                  <span>Teléfono / WhatsApp</span>
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Ej. 55 1234 5678"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202020] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#4E2B01]" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="Ej. usuario@estudiofoto.com"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#202020] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#4E2B01]" />
                  <span>Sucursal o Dirección</span>
                </label>
                <input
                  type="text"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Ej. Sucursal Matriz Centro"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#202020] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4E2B01]" />
                <span>Notas o Información Adicional</span>
              </label>
              <textarea
                rows={3}
                value={profile.notes || ''}
                onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                placeholder="Escribe detalles del operador, horario habitual, responsabilidades..."
                className="w-full text-xs sm:text-sm p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E2B01] resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#4E2B01] hover:bg-[#202020] active:scale-95 disabled:opacity-50 text-[#FFF3BC] font-black text-sm rounded-2xl shadow-lg transition cursor-pointer border border-[#ECB769]"
            >
              <Save className="w-5 h-5 text-[#ECB769]" />
              <span>{isSaving ? 'Guardando en Supabase...' : 'Guardar y Actualizar Perfil'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
