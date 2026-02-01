
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdate: (updatedUser: User) => Promise<void>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, currentUser, onUpdate }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Kiểm tra mật khẩu cũ (giả định mật khẩu được lưu trong object user)
    if (currentPassword !== currentUser.password) {
      setError('Mật khẩu hiện tại không chính xác.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu cũ.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate({
        ...currentUser,
        password: newPassword
      });
      alert('Đổi mật khẩu thành công!');
      onClose();
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật mật khẩu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Đổi mật khẩu</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Bảo mật tài khoản cá nhân</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-[11px] font-bold animate-pulse">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Mật khẩu hiện tại</label>
              <div className="relative group">
                <input 
                  required
                  type={showPass ? "text" : "password"}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
                <Lock className="w-4 h-4 absolute left-4 top-3.5 text-gray-300 group-focus-within:text-indigo-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Mật khẩu mới</label>
              <div className="relative group">
                <input 
                  required
                  type={showPass ? "text" : "password"}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <Lock className="w-4 h-4 absolute left-4 top-3.5 text-gray-300 group-focus-within:text-indigo-500" />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-3.5 text-gray-300 hover:text-indigo-500 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Xác nhận mật khẩu mới</label>
              <div className="relative group">
                <input 
                  required
                  type={showPass ? "text" : "password"}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
                <Lock className="w-4 h-4 absolute left-4 top-3.5 text-gray-300 group-focus-within:text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
            >
              {isSaving ? 'Đang cập nhật...' : 'Xác nhận đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
