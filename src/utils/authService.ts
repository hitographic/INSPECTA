import { gPost, gGet } from './googleApi';

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
      'create_record', 'edit_record', 'delete_record', 'view_records',
      'save_all_draft_to_completed', 'export_records', 'manage_users',
      'view_admin_panel', 'delete_monitoring_records'
    ]
  },
  {
    username: 'supervisor',
    password: 'super123',
    full_name: 'Supervisor',
    role: 'supervisor' as const,
    permissions: ['create_record', 'edit_record', 'view_records', 'export_records']
  },
  {
    username: 'qcfield',
    password: 'qc123',
    full_name: 'QC Field',
    role: 'qc_field' as const,
    permissions: ['create_record', 'view_records']
  },
  {
    username: 'manajer',
    password: 'manajer123',
    full_name: 'Manager',
    role: 'manajer' as const,
    permissions: [
      'create_record', 'edit_record', 'delete_record', 'view_records',
      'export_records', 'view_admin_panel', 'manage_master_data'
    ]
  }
];

class AuthService {
  private currentUser: AppUser | null = null;
  private initialized: boolean = false;

  async initializeDefaultUsers() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      const users = await gGet('getUsers');
      if (!users || users.length === 0) {
        for (const user of DEFAULT_USERS) {
          try {
            await gPost('createUser', {
              username: user.username,
              password: user.password,
              full_name: user.full_name,
              role: user.role,
              permissions: user.permissions,
              allowed_menus: ['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'],
              allowed_plants: ['Plant-1', 'Plant-2', 'Plant-3'],
              created_by: 'system'
            });
            console.log(`Default user ${user.username} created`);
          } catch (err) {
            console.error(`Error creating default user ${user.username}:`, err);
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
      const result = await gPost('login', { username, password });

      if (!result.success || !result.user) {
        console.error('Login failed:', result.error || 'Invalid credentials');
        return null;
      }

      const appUser: AppUser = {
        id: result.user.id,
        username: result.user.username,
        full_name: result.user.full_name,
        role: result.user.role,
        is_active: result.user.is_active,
        permissions: result.user.permissions || [],
        allowed_menus: Array.isArray(result.user.allowed_menus) ? result.user.allowed_menus : [],
        allowed_plants: Array.isArray(result.user.allowed_plants) ? result.user.allowed_plants : []
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
    if (this.currentUser) return this.currentUser;
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
    const plants = user?.allowed_plants;
    if (!plants) return [];
    if (Array.isArray(plants)) return plants;
    if (typeof plants === 'string') {
      try { const parsed = JSON.parse(plants); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  }

  getAllowedMenus(): string[] {
    const user = this.getCurrentUser();
    const menus = user?.allowed_menus;
    if (!menus) return [];
    if (Array.isArray(menus)) return menus;
    if (typeof menus === 'string') {
      try { const parsed = JSON.parse(menus); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
    }
    return [];
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || false;
  }

  async getAllUsers(): Promise<any[]> {
    try {
      return await gGet('getUsers') || [];
    } catch (error) {
      console.error('Failed to get users:', error);
      return [];
    }
  }

  async createUser(userData: {
    username: string; password: string; full_name: string;
    role: 'admin' | 'supervisor' | 'qc_field' | 'manajer';
    permissions: string[]; allowed_menus: string[]; allowed_plants: string[];
  }): Promise<boolean> {
    try {
      const result = await gPost('createUser', {
        ...userData,
        created_by: this.currentUser?.username || 'admin'
      });
      return result.success === true;
    } catch (error) {
      console.error('Create user error:', error);
      return false;
    }
  }

  async updateUser(userId: string, userData: {
    full_name?: string; role?: 'admin' | 'supervisor' | 'qc_field' | 'manajer';
    is_active?: boolean; permissions?: string[];
    allowed_menus?: string[]; allowed_plants?: string[];
  }): Promise<boolean> {
    try {
      const result = await gPost('updateUser', { id: userId, ...userData });
      return result.success === true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const result = await gPost('deleteUser', { id: userId });
      return result.success === true;
    } catch (error) {
      console.error('Delete user error:', error);
      return false;
    }
  }

  async getPermissionDefinitions(): Promise<any[]> {
    try {
      return await gGet('getPermissionDefinitions') || [];
    } catch (error) {
      console.error('Failed to get permission definitions:', error);
      return [];
    }
  }

  async getUserPermissions(username: string): Promise<string[]> {
    try {
      return await gPost('getUserPermissions', { username }) || [];
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  }
}

export const authService = new AuthService();
export const getUserPermissions = (username: string) => authService.getUserPermissions(username);
