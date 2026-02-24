import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User } from '../../types';
import { useUpdateUser } from '../../hooks/queries/useUsers';
import { usersLogger } from '../../lib/logger';

// Simple Select component wrapper or native select for now to avoid complexity
// In a real app we'd use Select primitive from Radix

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

interface UserFormData {
  full_name: string;
  email: string;
  role: 'admin' | 'founder' | 'staff' | 'user';
  phone?: string;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const { register, handleSubmit, reset, setValue } = useForm<UserFormData>();
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (user) {
      setValue('full_name', user.full_name || '');
      setValue('email', user.email);
      setValue('role', user.role);
      setValue('phone', user.phone || '');
    } else {
        reset();
    }
  }, [user, setValue, reset]);

  const onSubmit = async (data: UserFormData) => {
    if (!user) return; // Add mode not implemented yet fully (auth handles creation usually)

    try {
      await updateUser.mutateAsync({
        id: user.id,
        updates: data,
      });
      onOpenChange(false);
    } catch (error) {
      usersLogger.error('Failed to update user', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</DialogTitle>
          <DialogDescription>
            {user ? 'Cập nhật thông tin và phân quyền cho người dùng.' : 'Tạo mới người dùng thủ công.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Họ và tên</label>
            <Input {...register('full_name')} placeholder="Nguyễn Văn A" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input {...register('email')} disabled={!!user} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Số điện thoại</label>
            <Input {...register('phone')} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vai trò</label>
            <select
                {...register('role')}
                className="flex h-10 w-full rounded-lg border bg-white/50 dark:bg-zinc-900/50 px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:text-slate-100 dark:ring-offset-slate-950"
            >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="founder">Founder</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Hủy
            </Button>
            <Button type="submit" isLoading={updateUser.isPending}>
                Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
