import { supabase } from './supabase';

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'qc_field' | 'manajer';
  is_active: boolean;
  permissions: string[];
  allowed_menus: string[];
  allowed_plants: string[];
}

const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    full_name: 'Administrator',
    role: 'admin' as const,
    permissions: [
      'create_record',
      'edit_record',
      'delete_record',
      'view_records',
      'save_all_draft_to_completed',
      'export_records',
      'manage_users',
      'view_admin_panel'
    ]
  },
  {
    username: 'supervisor',
    password: 'super123',
    full_name: 'Supervisor',
    role: 'supervisor' as const,
    permissions: [
      'create_record',
      'edit_record',
      'view_records',
      'export_records'
    ]
  },
  {
    username: 'qcfield',
    password: 'qc123',
    full_name: 'QC Field',
    role: 'qc_field' as const,
    permissions: [
      'create_record',
      'view_records'
    ]
  },
  {
    username: 'manajer',
    password: 'manajer123',
    full_name: 'Manager',
    role: 'manajer' as const,
    permissions: [
      'create_record',
      'edit_record',
      'delete_record',
      'view_records',
      'export_records',
      'view_admin_panel',
      'manage_master_data'
    ]
  }
];

class AuthService {
  private currentUser: AppUser | null = null;

  async initializeDefaultUsers() {
    try {
      for (const user of DEFAULT_USERS) {
        const { data: existing } = await supabase
          .from('app_users')
          .select('id')
          .eq('username', user.username)
          .maybeSingle();

        if (!existing) {
          const { data: newUser } = await supabase
            .from('app_users')
            .insert({
              username: user.username,
              password_hash: user.password,
              full_name: user.full_name,
              role: user.role,
              is_active: true,
              allowed_menus: ['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'],
              allowed_plants: ['Plant-1', 'Plant-2', 'Plant-3'],
              created_by: 'system'
            })
            .select()
            .maybeSingle();

          if (newUser) {
            for (const permission of user.permissions) {
              await supabase
                .from('user_permissions')
                .insert({
                  user_id: newUser.id,
                  permission
                });
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize default users:', error);
    }
  }

  async login(username: string, password: string): Promise<AppUser | null> {
    try {
      console.log('Login attempt:', username);

      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .maybeSingle();

      console.log('User query result:', { user, error });

      if (error) {
        console.error('Database error:', error);
        return null;
      }

      if (!user) {
        console.error('User not found or inactive');
        return null;
      }

      console.log('Password check:', { provided: password, stored: user.password_hash });

      if (user.password_hash !== password) {
        console.error('Invalid password');
        return null;
      }

      const { data: permissions } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', user.id);

      const appUser: AppUser = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active,
        permissions: permissions?.map(p => p.permission) || [],
        allowed_menus: user.allowed_menus || [],
        allowed_plants: user.allowed_plants || []
      };

      this.currentUser = appUser;
      localStorage.setItem('currentUser', JSON.stringify(appUser));

      return appUser;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): AppUser | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    const stored = localStorage.getItem('currentUser');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return this.currentUser;
    }

    return null;
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user?.permissions.includes(permission) || false;
  }

  hasMenuAccess(menuId: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.allowed_menus.includes(menuId);
  }

  hasPlantAccess(plant: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    return user.allowed_plants.includes(plant);
  }

  getAllowedPlants(): string[] {
    const user = this.getCurrentUser();
    return user?.allowed_plants || [];
  }

  getAllowedMenus(): string[] {
    const user = this.getCurrentUser();
    return user?.allowed_menus || [];
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || false;
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const { data: users } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!users) return [];

      const usersWithPermissions = await Promise.all(
        users.map(async (user) => {
          const { data: permissions } = await supabase
            .from('user_permissions')
            .select('permission')
            .eq('user_id', user.id);

          return {
            ...user,
            permissions: permissions?.map(p => p.permission) || []
          };
        })
      );

      return usersWithPermissions;
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  async createUser(userData: {
    username: string;
    password: string;
    full_name: string;
    role: 'admin' | 'supervisor' | 'qc_field' | 'manajer';
    permissions: string[];
    allowed_menus: string[];
    allowed_plants: string[];
  }): Promise<boolean> {
    try {
      const { data: newUser, error } = await supabase
        .from('app_users')
        .insert({
          username: userData.username,
          password_hash: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          is_active: true,
          allowed_menus: userData.allowed_menus,
          allowed_plants: userData.allowed_plants,
          created_by: this.currentUser?.username || 'admin'
        })
        .select()
        .single();

      if (error || !newUser) {
        console.error('Failed to create user:', error);
        return false;
      }

      for (const permission of userData.permissions) {
        await supabase
          .from('user_permissions')
          .insert({
            user_id: newUser.id,
            permission
          });
      }

      return true;
    } catch (error) {
      console.error('Create user error:', error);
      return false;
    }
  }

  async updateUser(userId: string, userData: {
    full_name?: string;
    role?: 'admin' | 'supervisor' | 'qc_field' | 'manajer';
    is_active?: boolean;
    permissions?: string[];
    allowed_menus?: string[];
    allowed_plants?: string[];
  }): Promise<boolean> {
    try {
      const updates: any = {};
      if (userData.full_name) updates.full_name = userData.full_name;
      if (userData.role) updates.role = userData.role;
      if (userData.is_active !== undefined) updates.is_active = userData.is_active;
      if (userData.allowed_menus !== undefined) updates.allowed_menus = userData.allowed_menus;
      if (userData.allowed_plants !== undefined) updates.allowed_plants = userData.allowed_plants;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('app_users')
          .update(updates)
          .eq('id', userId);

        if (error) {
          console.error('Failed to update user:', error);
          return false;
        }
      }

      if (userData.permissions) {
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId);

        for (const permission of userData.permissions) {
          await supabase
            .from('user_permissions')
            .insert({
              user_id: userId,
              permission
            });
        }
      }

      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', userId);

      return !error;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  }

  async getPermissionDefinitions(): Promise<any[]> {
    try {
      const { data } = await supabase
        .from('permission_definitions')
        .select('*')
        .order('category', { ascending: true });

      return data || [];
    } catch (error) {
      console.error('Failed to get permission definitions:', error);
      return [];
    }
  }

  async getUserPermissions(username: string): Promise<string[]> {
    try {
      const { data: user } = await supabase
        .from('app_users')
        .select('id')
        .eq('username', username)
        .maybeSingle();

      if (!user) return [];

      const { data: permissions } = await supabase
        .from('user_permissions')
        .select('permission')
        .eq('user_id', user.id);

      return permissions?.map(p => p.permission) || [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }
}

export const authService = new AuthService();

export const getUserPermissions = (username: string) => authService.getUserPermissions(username);
