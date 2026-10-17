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
  Sparkles
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
      color: 'bg-teal-700/10 text-[#004C59] border-teal-600/30',
      badge: 'Control Total',
      icon: ShieldCheck,
    },
    cashier: {
      title: 'Cajero de Oficina (Mostrador)',
      color: 'bg-orange-500/10 text-[#F97800] border-orange-500/30',
      badge: 'Caja & Mostrador',
      icon: Store,
    },
    field: {
      title: 'Cobrador / Vendedor en Campo',
      color: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/30',
      badge: 'Móvil Escuelas',
      icon: Smartphone,
    },
    client: {
      title: 'Cliente (Catálogo Digital)',
      color: 'bg-indigo-500/10 text-indigo-800 border-indigo-500/30',
      badge: 'Consulta & Cotizaciones',
      icon: ShoppingBag,
    },
  }[currentRole];

  const RoleIcon = roleMeta.icon;

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-12 font-sans select-none">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-[#004C59] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-in slide-in-from-bottom border-2 border-teal-400">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 bg-[#004C59]/10 rounded-2xl shrink-0">
              <User className="w-7 h-7 text-[#004C59]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#004C59] text-[10px] font-black uppercase mb-1">
                <span>Gestión de Usuario y Cuenta</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Mi Perfil de Usuario
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Actualiza tu fotografía de perfil, datos personales y de contacto para tickets y cotizaciones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 border-slate-200 bg-slate-50 shrink-0">
            <RoleIcon className="w-5 h-5 text-[#004C59]" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Rol Activo</span>
              <span className="text-xs font-black text-slate-800">{roleMeta.title}</span>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* FOTO DE PERFIL / AVATAR */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#004C59]" />
              <span>Fotografía de Perfil</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
              {/* Avatar Preview */}
              <div className="relative group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#004C59] shadow-md bg-slate-100 flex items-center justify-center shrink-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                      <span className="text-[10px] font-bold mt-1 text-slate-400">Sin foto</span>
                    </div>
                  )}
                </div>

                {/* Quick overlay trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2.5 bg-[#F97800] hover:bg-orange-600 text-white rounded-full shadow-lg border-2 border-white cursor-pointer transition transform active:scale-95"
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
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4 text-yellow-400" />
                    <span>Subir Foto de mi Dispositivo</span>
                  </button>

                  {profile.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Quitar Foto</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 max-w-md">
                  Formatos recomendados: JPG, PNG o WebP (hasta 2MB). Esta foto se mostrará en la cabecera y en los tickets del sistema.
                </p>
              </div>
            </div>
          </div>

          {/* DATOS PERSONALES Y DE CONTACTO */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-5">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#004C59]" />
              <span>Información Personal & Contacto</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#004C59]" />
                  <span>Nombre Completo / Operador *</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Ej. Uriel Gómez"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#004C59]" />
                  <span>Teléfono / WhatsApp</span>
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="Ej. 55 1234 5678"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#004C59]" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="Ej. usuario@estudiofoto.com"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#004C59]" />
                  <span>Sucursal o Dirección</span>
                </label>
                <input
                  type="text"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Ej. Sucursal Matriz Centro"
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#004C59]" />
                <span>Notas o Información Adicional</span>
              </label>
              <textarea
                rows={3}
                value={profile.notes || ''}
                onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                placeholder="Escribe detalles del operador, horario habitual, responsabilidades..."
                className="w-full text-xs sm:text-sm p-3.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004C59] resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#004C59] hover:bg-teal-900 active:scale-95 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg transition cursor-pointer"
            >
              <Save className="w-5 h-5 text-yellow-400" />
              <span>{isSaving ? 'Guardando en Supabase...' : 'Guardar y Actualizar Perfil'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
