// 角色权限 Hook — 前端按 user.role 决定 UI 显示
import { useAuthStore } from '../stores/authStore'

export type Role = 'admin' | 'visitor'

export function usePermission() {
  const role = useAuthStore((state) => state.user?.role) as Role | undefined

  return {
    role,
    /** 能否编辑内容(文章/项目/分类/标签) */
    canEdit: role === 'admin',
    /** 能否上传图片 */
    canUpload: role === 'admin',
    /** 能否查看后台管理页 */
    canManage: role === 'admin',
    /** 能否查看仪表盘统计 */
    canViewStats: role === 'admin',
    /** 能否邀请新用户(查看自己的邀请码) */
    canInvite: role === 'admin',
    /** 是不是管理员 */
    isAdmin: role === 'admin',
    /** 是不是访客 */
    isVisitor: role === 'visitor',
    /** 是否登录(任意角色) */
    isAuthenticated: !!role,
  }
}