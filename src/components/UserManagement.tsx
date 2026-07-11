import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../utils/translations';
import { 
  Search, UserPlus, Edit2, Trash2, Shield, User, Star, 
  Check, X, Users, CreditCard, Cpu, Sparkles, ShieldAlert,
  AlertCircle, CheckCircle, Terminal, Activity,
  Folder, Download, CheckSquare, Square
} from 'lucide-react';
import AuditLogs from './AuditLogs';
import { addAuditLog } from '../utils/auditLogger';
import { Tenant } from '../types';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

interface UserManagementProps {
  language: Language;
  currentUserEmail: string;
  tenants?: Tenant[];
  onTenantsChange?: (updated: Tenant[]) => void;
}

interface LocalUser {
  name: string;
  email: string;
  password?: string;
  plan?: string;
  createdAt?: string;
}

export default function UserManagement({ language, currentUserEmail, tenants = [], onTenantsChange }: UserManagementProps) {
  const t = translations[language];
  const isRTL = language === 'ar';

  const [subTab, setSubTab] = useState<'directory' | 'audit' | 'workspaces'>('directory');
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  
  // Modals / forms
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LocalUser | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPlan, setFormPlan] = useState('annual');

  // Notices
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  // Initial load
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const rawUsers = localStorage.getItem('sniper_users') || '[]';
    try {
      const parsed = JSON.parse(rawUsers);
      setUsers(parsed);
    } catch (e) {
      console.error('Error parsing sniper_users', e);
      setUsers([]);
    }
  };

  const saveUsersToStorage = (updatedUsers: LocalUser[]) => {
    localStorage.setItem('sniper_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const filteredWorkspaces = tenants.filter(w => {
    const q = workspaceSearch.toLowerCase().trim();
    return w.name.toLowerCase().includes(q) || w.industry.toLowerCase().includes(q) || w.id.toLowerCase().includes(q);
  });

  const handleSelectAllWorkspaces = (filtered: Tenant[]) => {
    if (selectedWorkspaceIds.length === filtered.length && filtered.length > 0) {
      setSelectedWorkspaceIds([]);
    } else {
      setSelectedWorkspaceIds(filtered.map(w => w.id));
    }
  };

  const handleSelectWorkspace = (id: string) => {
    if (selectedWorkspaceIds.includes(id)) {
      setSelectedWorkspaceIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedWorkspaceIds(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedWorkspaceIds.length === 0) return;

    triggerConfirm(
      language === 'ar' ? 'تأكيد الحذف الجماعي' : 'Confirm Bulk Delete',
      t.deleteTenantConfirm,
      () => {
        fetch('/api/tenants/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedWorkspaceIds })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && onTenantsChange) {
              onTenantsChange(data.tenants);
              showNotification(t.workspacesDeletedSuccess);
              addAuditLog(
                currentUserEmail,
                'WORKSPACE',
                `Bulk deleted ${selectedWorkspaceIds.length} tenant workspaces: ${selectedWorkspaceIds.join(', ')}`,
                'SUCCESS'
              );
              setSelectedWorkspaceIds([]);
            } else {
              showNotification(language === 'ar' ? 'فشلت عملية الحذف.' : 'Delete operation failed.', true);
            }
          })
          .catch(err => {
            console.error("Bulk delete failed:", err);
            showNotification(language === 'ar' ? 'حدث خطأ أثناء الحذف.' : 'Error occurred during deletion.', true);
          });
      }
    );
  };

  const handleSingleTenantDelete = (id: string, name: string) => {
    const confirmMessage = language === 'ar' 
      ? `هل أنت متأكد من رغبتك في حذف مساحة العمل "${name}" نهائياً؟`
      : `Are you sure you want to permanently delete the workspace "${name}"?`;
      
    triggerConfirm(
      language === 'ar' ? 'حذف مساحة العمل' : 'Delete Workspace',
      confirmMessage,
      () => {
        fetch('/api/tenants/bulk-delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [id] })
        })
          .then(res => res.json())
          .then(data => {
            if (data.success && onTenantsChange) {
              onTenantsChange(data.tenants);
              showNotification(language === 'ar' ? `تم حذف مساحة العمل "${name}" بنجاح.` : `Successfully deleted workspace "${name}".`);
              addAuditLog(
                currentUserEmail,
                'WORKSPACE',
                `Deleted tenant workspace: ${name} (${id})`,
                'SUCCESS'
              );
              setSelectedWorkspaceIds(prev => prev.filter(item => item !== id));
            } else {
              showNotification(language === 'ar' ? 'فشلت عملية الحذف.' : 'Delete operation failed.', true);
            }
          })
          .catch(err => {
            console.error("Delete tenant failed:", err);
            showNotification(language === 'ar' ? 'حدث خطأ أثناء الحذف.' : 'Error occurred during deletion.', true);
          });
      }
    );
  };

  const handleBulkExport = (filtered: Tenant[]) => {
    const selected = filtered.filter(w => selectedWorkspaceIds.includes(w.id));
    if (selected.length === 0) return;

    const exportData = JSON.stringify(selected, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SniperAI_Workspaces_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(t.workspacesExportedSuccess);
    addAuditLog(
      currentUserEmail,
      'WORKSPACE',
      `Bulk exported ${selected.length} tenant workspace configuration records.`,
      'SUCCESS'
    );
  };

  // Add user handler
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showNotification(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill all required fields.', true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      showNotification(language === 'ar' ? 'البريد الإلكتروني غير صالح.' : 'Invalid email format.', true);
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === formEmail.toLowerCase().trim());
    if (emailExists) {
      showNotification(language === 'ar' ? 'البريد الإلكتروني مسجل بالفعل.' : 'Email is already registered.', true);
      return;
    }

    const newUser: LocalUser = {
      name: formName.trim(),
      email: formEmail.toLowerCase().trim(),
      password: formPassword,
      plan: formPlan,
      createdAt: new Date().toISOString()
    };

    const updated = [...users, newUser];
    saveUsersToStorage(updated);
    showNotification(t.userCreatedSuccess);
    addAuditLog(
      currentUserEmail, 
      'ADMIN', 
      `Created new user account: ${newUser.name} (${newUser.email}) with plan: ${newUser.plan}`, 
      'SUCCESS'
    );
    
    // Close & reset
    setIsAddModalOpen(false);
    resetForm();
  };

  // Edit user setup
  const openEditModal = (user: LocalUser) => {
    setSelectedUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || '••••••••');
    setFormPlan(user.plan || 'monthly');
    setIsEditModalOpen(true);
  };

  // Edit user handler
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!formName.trim()) {
      showNotification(language === 'ar' ? 'الاسم مطلوب.' : 'Name is required.', true);
      return;
    }

    const updated = users.map(u => {
      if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
        return {
          ...u,
          name: formName.trim(),
          plan: formPlan,
          // Only update password if they typed something other than placeholder dots
          password: formPassword !== '••••••••' ? formPassword : u.password
        };
      }
      return u;
    });

    saveUsersToStorage(updated);
    showNotification(t.userUpdatedSuccess);
    addAuditLog(
      currentUserEmail,
      'ADMIN',
      `Updated user account settings: ${formName.trim()} (${selectedUser.email}) with plan: ${formPlan}`,
      'SUCCESS'
    );
    setIsEditModalOpen(false);
    resetForm();
  };

  // Delete user handler
  const handleDeleteUser = async (email: string) => {
    if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
      showNotification(language === 'ar' ? 'لا يمكنك حذف حسابك الشخصي الذي تستخدمه حالياً!' : 'You cannot delete your own active account!', true);
      return;
    }

    triggerConfirm(
      language === 'ar' ? 'حذف المستخدم' : 'Delete User',
      t.deleteUserConfirm,
      async () => {
        try {
          // Delete user profile from Firestore if exists
          const docRef = doc(db, 'user_profiles', email.toLowerCase().trim());
          try {
            await deleteDoc(docRef);
          } catch (deleteErr) {
            handleFirestoreError(deleteErr, OperationType.DELETE, `user_profiles/${email.toLowerCase().trim()}`, currentUserEmail);
          }
        } catch (e) {
          console.error("Error deleting user profile from Firestore:", e);
        }

        const updated = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
        saveUsersToStorage(updated);
        showNotification(t.userDeletedSuccess);
        addAuditLog(
          currentUserEmail,
          'SECURITY',
          `Deleted user account: ${email}`,
          'WARNING'
        );
      }
    );
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPlan('annual');
    setSelectedUser(null);
  };

  // Filter computations
  const rawFilteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter === 'All' || (user.plan || 'monthly') === planFilter;

    return matchesSearch && matchesPlan;
  });
  const filteredUsers = Array.from(new Map(rawFilteredUsers.map(u => [u.email.toLowerCase(), u])).values());

  // KPI computations
  const totalCount = users.length;
  const monthlyCount = users.filter(u => (u.plan || 'monthly') === 'monthly').length;
  const annualCount = users.filter(u => u.plan === 'annual').length;
  const enterpriseCount = users.filter(u => u.plan === 'enterprise').length;
  const adminCount = users.filter(u => u.email.toLowerCase().includes('admin') || u.email === 'admin@sniper.ai').length;

  return (
    <div className="space-y-6">
      {/* Alert notifications */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4.5 py-3 rounded-2xl shadow-xl backdrop-blur-md text-xs font-semibold"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4.5 py-3 rounded-2xl shadow-xl backdrop-blur-md text-xs font-semibold"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-slate-900 pb-3 gap-2 justify-start">
        <button
          id="admin-user-directory-tab"
          onClick={() => setSubTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            subTab === 'directory'
              ? 'bg-gradient-to-r from-indigo-600/10 to-violet-600/10 text-indigo-400 border-indigo-500/20 shadow-md'
              : 'text-slate-400 hover:text-white border-transparent bg-transparent hover:bg-slate-900/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t.adminTab}</span>
        </button>
        <button
          id="admin-security-audit-tab"
          onClick={() => setSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            subTab === 'audit'
              ? 'bg-gradient-to-r from-indigo-600/10 to-violet-600/10 text-indigo-400 border-indigo-500/20 shadow-md'
              : 'text-slate-400 hover:text-white border-transparent bg-transparent hover:bg-slate-900/40'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>{t.auditTab}</span>
        </button>
        <button
          id="admin-workspaces-tab"
          onClick={() => setSubTab('workspaces')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            subTab === 'workspaces'
              ? 'bg-gradient-to-r from-indigo-600/10 to-violet-600/10 text-indigo-400 border-indigo-500/20 shadow-md'
              : 'text-slate-400 hover:text-white border-transparent bg-transparent hover:bg-slate-900/40'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>{t.workspacesTab}</span>
        </button>
      </div>

      {subTab === 'audit' ? (
        <AuditLogs language={language} currentUserEmail={currentUserEmail} />
      ) : subTab === 'workspaces' ? (
        <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-5 shadow-xl space-y-5">
          {/* Header metadata */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-900">
            <div className="text-start">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>{t.workspaceListTitle}</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-light mt-1">
                {t.workspaceListDesc}
              </p>
            </div>
          </div>

          {/* Controls bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1 max-w-md relative">
              <span className={`absolute inset-y-0 ${isRTL ? 'right-3' : 'left-3'} flex items-center text-slate-500`}>
                <Search className="w-4 h-4 text-slate-500" />
              </span>
              <input
                type="text"
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                placeholder={t.searchWorkspacesPlaceholder}
                className={`w-full bg-slate-900 text-white text-xs ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 focus:outline-none transition-all`}
              />
            </div>

            {/* Bulk actions trigger */}
            <div className="flex items-center gap-3 justify-start sm:justify-end">
              <button
                disabled={selectedWorkspaceIds.length === 0}
                onClick={() => handleBulkExport(filteredWorkspaces)}
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer h-10 ${
                  selectedWorkspaceIds.length > 0
                    ? 'bg-emerald-950/20 hover:bg-emerald-900/40 text-emerald-400 border-emerald-900/30 font-bold'
                    : 'bg-slate-900/20 text-slate-600 border-slate-900 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{t.bulkExportBtn}</span>
                {selectedWorkspaceIds.length > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {selectedWorkspaceIds.length}
                  </span>
                )}
              </button>

              <button
                disabled={selectedWorkspaceIds.length === 0}
                onClick={handleBulkDelete}
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all cursor-pointer h-10 ${
                  selectedWorkspaceIds.length > 0
                    ? 'bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border-rose-900/30 font-bold'
                    : 'bg-slate-900/20 text-slate-600 border-slate-900 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>{t.bulkDeleteBtn}</span>
                {selectedWorkspaceIds.length > 0 && (
                  <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full text-[10px] font-mono">
                    {selectedWorkspaceIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Workspaces list table */}
          <div className="overflow-x-auto pt-2">
            {filteredWorkspaces.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
                <p className="text-xs font-light">{t.noWorkspacesFound}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    <th className="pb-3.5 pl-4 pr-2 w-10">
                      <button
                        onClick={() => handleSelectAllWorkspaces(filteredWorkspaces)}
                        className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                      >
                        {selectedWorkspaceIds.length === filteredWorkspaces.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.workspaceName}</th>
                    <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.workspaceIndustry}</th>
                    <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.workspaceCurrency}</th>
                    <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.workspaceSource}</th>
                    <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.workspaceDesc}</th>
                    <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} text-center`}>{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-xs">
                  {Array.from(new Map(filteredWorkspaces.map(w => [w.id, w])).values()).map((workspace) => {
                    const isSelected = selectedWorkspaceIds.includes(workspace.id);
                    return (
                      <tr
                        key={workspace.id}
                        className={`transition-colors hover:bg-slate-900/20 ${
                          isSelected ? 'bg-indigo-950/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 pl-4 pr-2">
                          <button
                            onClick={() => handleSelectWorkspace(workspace.id)}
                            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Name */}
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2 h-2 rounded-full`}
                              style={{
                                backgroundColor:
                                  workspace.accentColor === 'indigo'
                                    ? '#4f46e5'
                                    : workspace.accentColor === 'rose'
                                    ? '#e11d48'
                                    : workspace.accentColor === 'emerald'
                                    ? '#059669'
                                    : workspace.accentColor === 'amber'
                                    ? '#d97706'
                                    : '#4f46e5',
                              }}
                            ></span>
                            <div className="text-start">
                              <span className="font-bold text-white text-xs block">
                                {workspace.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                id: {workspace.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Industry */}
                        <td className="py-4 pr-4 text-slate-300 font-medium text-start">
                          {workspace.industry}
                        </td>

                        {/* Currency */}
                        <td className="py-4 pr-4 font-semibold text-slate-400 font-mono uppercase tracking-wider text-start">
                          {workspace.currency || 'USD'}
                        </td>

                        {/* Data Source Provider */}
                        <td className="py-4 pr-4 text-start">
                          <span className="bg-slate-900 text-indigo-400 border border-slate-800 px-2 py-1 rounded-lg text-[10px] font-mono">
                            {workspace.dataSource?.provider || 'Native Storage'}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 pr-4 text-slate-400 font-light max-w-xs truncate text-start">
                          {workspace.description}
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleSingleTenantDelete(workspace.id, workspace.name)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-500/25 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                              title={language === 'ar' ? 'حذف مساحة العمل' : 'Delete Workspace'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Admin metrics header */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* KPI: Total Users */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl"></div>
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'ar' ? 'إجمالي الأعضاء' : 'Total Accounts'}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{totalCount}</div>
        </div>

        {/* KPI: Monthly Starters */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'ar' ? 'باقة شهرية' : 'Monthly Starter'}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{monthlyCount}</div>
        </div>

        {/* KPI: Annual Pros */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>{language === 'ar' ? 'باقة سنوية' : 'Annual Pro'}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{annualCount}</div>
        </div>

        {/* KPI: Enterprise */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ar' ? 'مؤسسات كبرى' : 'Enterprise Scale'}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{enterpriseCount}</div>
        </div>

        {/* KPI: Admins */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>{language === 'ar' ? 'المشرفون' : 'Administrators'}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{adminCount}</div>
        </div>
      </div>

      {/* Table controls */}
      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-900">
          <div className="flex-1 max-w-lg relative">
            <span className={`absolute inset-y-0 ${isRTL ? 'right-3' : 'left-3'} flex items-center text-slate-500`}>
              <Search className="w-4 h-4 text-slate-500" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchUsersPlaceholder}
              className={`w-full bg-slate-900 text-white text-xs ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 focus:outline-none transition-all`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Plan selector filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{language === 'ar' ? 'تصفية الباقة' : 'Plan'}</span>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none cursor-pointer appearance-none px-1"
              >
                <option value="All" className="bg-slate-950 text-white">{t.allPlans}</option>
                <option value="monthly" className="bg-slate-950 text-white">{t.monthlyPlanName}</option>
                <option value="annual" className="bg-slate-950 text-white">{t.annualPlanName}</option>
                <option value="enterprise" className="bg-slate-950 text-white">{t.enterprisePlanName}</option>
              </select>
            </div>

            {/* Add User trigger button */}
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md border border-indigo-500/20 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.addUserBtn}</span>
            </button>
          </div>
        </div>

        {/* User list table */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2.5" />
              <p className="text-xs font-light">{t.noUsersFound}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{language === 'ar' ? 'الاسم والبريد' : 'User profile / Email'}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.planLabel}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.dateJoined}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.roleLabel}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} text-center`}>{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs">
                {filteredUsers.map((user) => {
                  const isUserAdmin = user.email.toLowerCase().includes('admin') || user.email === 'admin@sniper.ai';
                  const userPlan = user.plan || 'monthly';
                  
                  return (
                    <tr key={user.email} className="hover:bg-slate-900/25 transition-colors">
                      {/* Name / Email */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center shrink-0 border ${
                            isUserAdmin 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            {isUserAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className="text-start">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.email.toLowerCase() === currentUserEmail.toLowerCase() && (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                  {language === 'ar' ? 'حسابك' : 'You'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan badge */}
                      <td className="py-3.5">
                        <div className="flex justify-start">
                          {userPlan === 'enterprise' ? (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                              <Star className="w-3 h-3 fill-amber-400/20" />
                              <span>{t.enterprisePlanName}</span>
                            </span>
                          ) : userPlan === 'annual' ? (
                            <span className="inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                              <Sparkles className="w-3 h-3 fill-violet-400/20" />
                              <span>{t.annualPlanName}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                              <Cpu className="w-3 h-3 text-blue-400" />
                              <span>{t.monthlyPlanName}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date Joined */}
                      <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>

                      {/* Access authorization */}
                      <td className="py-3.5">
                        <div className="flex justify-start">
                          {isUserAdmin ? (
                            <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded-md font-semibold">
                              {language === 'ar' ? 'مشرف النظام' : 'SysAdmin'}
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md">
                              {language === 'ar' ? 'مستخدم تنفيذي' : 'Executive User'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 bg-slate-900 hover:bg-indigo-500/25 text-slate-400 hover:text-indigo-400 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                            title={t.editUserTitle}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(user.email)}
                            disabled={user.email.toLowerCase() === currentUserEmail.toLowerCase()}
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/25 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 disabled:hover:text-slate-400 transition-colors cursor-pointer"
                            title={language === 'ar' ? 'حذف المستخدم' : 'Delete User'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 relative shadow-2xl"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`absolute top-4.5 ${isRTL ? 'left-4.5' : 'right-4.5'} text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-900`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <h3 className="text-sm font-bold text-white tracking-tight">{t.addNewUserTitle}</h3>
                  <p className="text-[11px] text-slate-500 font-light mt-0.5">{language === 'ar' ? 'إضافة مستخدم جديد للنظام وتعيين باقته' : 'Provision a new executive client node'}</p>
                </div>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-start">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Abdullah Salem"
                    className="w-full bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all text-start"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-start">
                    {t.email}
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. employee@company.com"
                    className="w-full bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all text-start font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-start">
                    {t.password}
                  </label>
                  <input
                    type="password"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all text-start"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-start">
                    {t.planLabel}
                  </label>
                  <div className="relative">
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer text-start"
                    >
                      <option value="monthly" className="bg-slate-950 text-white">{t.monthlyPlanName}</option>
                      <option value="annual" className="bg-slate-950 text-white">{t.annualPlanName}</option>
                      <option value="enterprise" className="bg-slate-950 text-white">{t.enterprisePlanName}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 cursor-pointer transition-colors"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold border border-indigo-500/20 shadow-md shadow-indigo-950/40 cursor-pointer transition-all"
                  >
                    {language === 'ar' ? 'إضافة مستخدم' : 'Provision User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 relative shadow-2xl"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className={`absolute top-4.5 ${isRTL ? 'left-4.5' : 'right-4.5'} text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-900`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div className="text-start">
                  <h3 className="text-sm font-bold text-white tracking-tight">{t.editUserTitle}</h3>
                  <p className="text-[11px] text-slate-500 font-light mt-0.5">{selectedUser.email}</p>
                </div>
              </div>

              <form onSubmit={handleEditUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-start">
                    {t.fullName}
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all text-start"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-start">
                    {t.password} ({language === 'ar' ? 'اتركه كما هو لتجنب التغيير' : 'Leave unchanged if same'})
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 outline-none transition-all text-start"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-start">
                    {t.planLabel}
                  </label>
                  <div className="relative">
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer text-start"
                    >
                      <option value="monthly" className="bg-slate-950 text-white">{t.monthlyPlanName}</option>
                      <option value="annual" className="bg-slate-950 text-white">{t.annualPlanName}</option>
                      <option value="enterprise" className="bg-slate-950 text-white">{t.enterprisePlanName}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 cursor-pointer transition-colors"
                  >
                    {t.cancelBtn}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold border border-indigo-500/20 shadow-md shadow-indigo-950/40 cursor-pointer transition-all"
                  >
                    {t.saveChanges}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        language={language}
      />
    </div>
  );
}
