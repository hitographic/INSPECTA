import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, FileEdit as Edit2, Trash2, Save, X, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { authService } from '../utils/authService';
import { parseCSV, validateCSVUsers, downloadCSVTemplate, CSVUserData } from '../utils/csvUtils';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'supervisor' | 'qc_field' | 'manajer';
  is_active: boolean;
  permissions: string[];
  allowed_menus: string[];
  allowed_plants: string[];
  created_at: string;
}

interface PermissionDef {
  permission_name: string;
  description: string;
  category: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [permissionDefs, setPermissionDefs] = useState<PermissionDef[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvPreview, setCSVPreview] = useState<CSVUserData[]>([]);
  const [csvErrors, setCSVErrors] = useState<string[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy] = useState<'username' | 'full_name' | 'role' | 'created_at'>('created_at');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'qc_field' as 'admin' | 'supervisor' | 'qc_field' | 'manajer',
    permissions: [] as string[],
    allowed_menus: [] as string[],
    allowed_plants: [] as string[]
  });

  const [bulkUpdateData, setBulkUpdateData] = useState({
    permissions: [] as string[],
    allowed_menus: [] as string[],
    allowed_plants: [] as string[],
    updatePermissions: false,
    updateMenus: false,
    updatePlants: false
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !authService.hasPermission('view_admin_panel')) {
      alert('Anda tidak memiliki akses ke halaman ini');
      navigate('/records');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    const [usersData, permsData] = await Promise.all([
      authService.getAllUsers(),
      authService.getPermissionDefinitions()
    ]);
    setUsers(usersData);
    setPermissionDefs(permsData);
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (!formData.username || !formData.password || !formData.full_name) {
      alert('Semua field harus diisi');
      return;
    }

    const success = await authService.createUser(formData);
    if (success) {
      alert('User berhasil ditambahkan');
      setShowAddUser(false);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'qc_field',
        permissions: [],
        allowed_menus: [],
        allowed_plants: []
      });
      loadData();
    } else {
      alert('Gagal menambahkan user');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const success = await authService.updateUser(editingUser.id, {
      full_name: formData.full_name,
      role: formData.role,
      is_active: editingUser.is_active,
      permissions: formData.permissions,
      allowed_menus: formData.allowed_menus,
      allowed_plants: formData.allowed_plants
    });

    if (success) {
      alert('User berhasil diupdate');
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'qc_field',
        permissions: [],
        allowed_menus: [],
        allowed_plants: []
      });
      loadData();
    } else {
      alert('Gagal mengupdate user');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Hapus user ${username}?`)) return;

    const success = await authService.deleteUser(userId);
    if (success) {
      alert('User berhasil dihapus');
      loadData();
    } else {
      alert('Gagal menghapus user');
    }
  };

  const handleToggleActive = async (user: User) => {
    const success = await authService.updateUser(user.id, {
      is_active: !user.is_active
    });

    if (success) {
      alert(`User ${!user.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      loadData();
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions,
      allowed_menus: user.allowed_menus || [],
      allowed_plants: user.allowed_plants || []
    });
    setShowAddUser(true);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowAddUser(false);
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'qc_field',
      permissions: [],
      allowed_menus: [],
      allowed_plants: []
    });
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'supervisor': return 'Supervisor';
      case 'qc_field': return 'QC Field';
      case 'manajer': return 'Manager';
      default: return role;
    }
  };

  const groupedPermissions = permissionDefs.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, PermissionDef[]>);

  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCSVErrors([]);
    setCSVPreview([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const users = parseCSV(csvText);
        const errors = validateCSVUsers(users);

        if (errors.length > 0) {
          setCSVErrors(errors);
        } else {
          setCSVPreview(users);
        }
      } catch (error) {
        setCSVErrors([error instanceof Error ? error.message : 'Error parsing CSV']);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSV = async () => {
    if (csvPreview.length === 0) {
      alert('Tidak ada data untuk diimport');
      return;
    }

    if (csvErrors.length > 0) {
      alert('Perbaiki error terlebih dahulu sebelum import');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const userData of csvPreview) {
      const menusArray = userData.menus ? userData.menus.split(',').map(m => m.trim()) : [];
      const plantsArray = userData.plants ? userData.plants.split(',').map(p => p.trim()) : [];

      const success = await authService.createUser({
        username: userData.nik,
        password: userData.password,
        full_name: userData.full_name,
        role: userData.role,
        permissions: [],
        allowed_menus: menusArray,
        allowed_plants: plantsArray
      });

      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    alert(`Import selesai!\nBerhasil: ${successCount}\nGagal: ${errorCount}`);

    setShowCSVUpload(false);
    setCSVPreview([]);
    setCSVErrors([]);
    loadData();
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedUsers.size === 0) {
      alert('Pilih minimal 1 user untuk update');
      return;
    }

    if (!bulkUpdateData.updatePermissions && !bulkUpdateData.updateMenus && !bulkUpdateData.updatePlants) {
      alert('Pilih minimal 1 jenis update (Permissions, Menus, atau Plants)');
      return;
    }

    const confirmed = window.confirm(`Update ${selectedUsers.size} user yang dipilih?`);
    if (!confirmed) return;

    let successCount = 0;
    let errorCount = 0;

    for (const userId of Array.from(selectedUsers)) {
      const updatePayload: any = {};

      if (bulkUpdateData.updatePermissions) {
        updatePayload.permissions = bulkUpdateData.permissions;
      }
      if (bulkUpdateData.updateMenus) {
        updatePayload.allowed_menus = bulkUpdateData.allowed_menus;
      }
      if (bulkUpdateData.updatePlants) {
        updatePayload.allowed_plants = bulkUpdateData.allowed_plants;
      }

      const success = await authService.updateUser(userId, updatePayload);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }

    alert(`Bulk update selesai!\nBerhasil: ${successCount}\nGagal: ${errorCount}`);

    setShowBulkUpdate(false);
    setSelectedUsers(new Set());
    setBulkUpdateData({
      permissions: [],
      allowed_menus: [],
      allowed_plants: [],
      updatePermissions: false,
      updateMenus: false,
      updatePlants: false
    });
    loadData();
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' ? user.is_active : !user.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredAndSortedUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus, sortBy, sortOrder]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedUsers(new Set()); // Clear selection when changing pages
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '0.5rem' }}>
      <button className="back-button" onClick={() => navigate('/records')} style={{ margin: '0.5rem' }}>
        <ArrowLeft size={24} />
      </button>

      <div className="card" style={{ padding: '1rem' }}>
        <div className="header">
          <h1 className="title" style={{ fontSize: '1.5rem' }}>Admin Panel</h1>
          <p className="subtitle">Kelola Users dan Permissions</p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button
            className="button button-primary"
            onClick={() => setShowAddUser(true)}
            style={{ fontSize: '0.875rem', padding: '0.625rem 1rem', flex: '1 1 auto', minWidth: '120px' }}
          >
            <UserPlus size={18} />
            <span className="mobile-hide">Tambah User</span>
            <span className="mobile-show" style={{ display: 'none' }}>Tambah</span>
          </button>
          <button
            className="button"
            onClick={() => navigate('/master-data')}
            style={{ background: '#8B5CF6', color: 'white', fontSize: '0.875rem', padding: '0.625rem 1rem', flex: '1 1 auto', minWidth: '100px' }}
          >
            <Edit2 size={18} />
            <span className="mobile-hide">Master Data</span>
            <span className="mobile-show" style={{ display: 'none' }}>Master</span>
          </button>
          <button
            className="button"
            onClick={() => navigate('/audit-log')}
            style={{ background: '#EF4444', color: 'white', fontSize: '0.875rem', padding: '0.625rem 1rem', flex: '1 1 auto', minWidth: '100px' }}
          >
            <Trash2 size={18} />
            <span className="mobile-hide">Audit Log</span>
            <span className="mobile-show" style={{ display: 'none' }}>Audit</span>
          </button>
          <button
            className="button"
            onClick={() => setShowCSVUpload(true)}
            style={{ background: '#10B981', color: 'white', fontSize: '0.875rem', padding: '0.625rem 1rem', flex: '1 1 auto', minWidth: '100px' }}
          >
            <Upload size={18} />
            <span className="mobile-hide">Import CSV</span>
            <span className="mobile-show" style={{ display: 'none' }}>CSV</span>
          </button>
          <button
            className="button"
            onClick={downloadCSVTemplate}
            style={{ background: '#3B82F6', color: 'white', fontSize: '0.875rem', padding: '0.625rem 1rem', flex: '1 1 auto', minWidth: '100px' }}
          >
            <Download size={18} />
            <span className="mobile-hide">Template</span>
          </button>
          {selectedUsers.size > 0 && (
            <button
              className="button"
              onClick={() => setShowBulkUpdate(true)}
              style={{ background: '#F59E0B', color: 'white', fontSize: '0.875rem', padding: '0.625rem 1rem', flex: '1 1 auto', minWidth: '100px' }}
            >
              <Edit2 size={18} />
              Bulk ({selectedUsers.size})
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.5rem',
          marginBottom: '1rem',
          padding: '0.75rem',
          background: '#F9FAFB',
          borderRadius: '0.5rem',
          border: '1px solid #E5E7EB'
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem', display: 'block' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Cari NIK/Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.8rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem', display: 'block' }}>
              Role
            </label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.8rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem'
              }}
            >
              <option value="all">Semua</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="qc_field">QC Field</option>
              <option value="manajer">Manajer</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem', display: 'block' }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.8rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem'
              }}
            >
              <option value="all">Semua</option>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.25rem', display: 'block' }}>
              Per Page
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.8rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.375rem'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: '#EFF6FF', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1E40AF' }}>
            {startIndex + 1}-{Math.min(endIndex, filteredAndSortedUsers.length)} dari {filteredAndSortedUsers.length}
            {selectedUsers.size > 0 && ` • ${selectedUsers.size} dipilih`}
          </span>
          {paginatedUsers.length > 0 && (
            <button
              onClick={toggleSelectAll}
              style={{
                padding: '0.375rem 0.75rem',
                fontSize: '0.7rem',
                fontWeight: '600',
                background: selectedUsers.size === paginatedUsers.length ? '#EF4444' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              {selectedUsers.size === paginatedUsers.length ? 'Unselect' : 'Select'} All
            </button>
          )}
        </div>

        {showAddUser && (
          <div className="popup-overlay" onClick={cancelEdit}>
            <div className="popup-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', width: '600px', maxHeight: '90vh', overflowY: 'auto', margin: '1rem' }}>
              <div className="popup-header">
                <h3 style={{ fontSize: '1.125rem' }}>{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                <button onClick={cancelEdit}>
                  <X size={24} />
                </button>
              </div>

              <div className="popup-body" style={{ padding: '1rem' }}>
                <div className="form-group">
                  <label className="label">NIK</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    disabled={!!editingUser}
                    placeholder="Masukkan NIK"
                    required
                  />
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label className="label">Password</label>
                    <input
                      type="password"
                      className="input"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Role</label>
                  <select
                    className="select"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="qc_field">QC Field</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manajer">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label" style={{ marginBottom: '0.75rem' }}>Permissions</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '0.375rem', padding: '0.5rem' }}>
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} style={{ marginBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '600', color: '#6366F1', marginBottom: '0.375rem' }}>
                          {category}
                        </h4>
                        {perms.map(perm => (
                          <label
                            key={perm.permission_name}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.375rem',
                              cursor: 'pointer',
                              borderRadius: '0.375rem',
                              marginBottom: '0.25rem',
                              background: formData.permissions.includes(perm.permission_name) ? '#EEF2FF' : 'transparent',
                              fontSize: '0.8rem'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(perm.permission_name)}
                              onChange={() => togglePermission(perm.permission_name)}
                              style={{ marginRight: '0.5rem' }}
                            />
                            <div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '500' }}>{perm.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="label" style={{ marginBottom: '0.75rem' }}>Menu Access</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                    {[
                      { id: 'sanitasi_besar', name: 'Sanitasi Besar' },
                      { id: 'kliping', name: 'Kliping' },
                      { id: 'monitoring_area', name: 'Monitoring Area' },
                      { id: 'audit_internal', name: 'Audit Internal' }
                    ].map(menu => (
                      <label
                        key={menu.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          background: formData.allowed_menus.includes(menu.id) ? '#DCFCE7' : '#F9FAFB',
                          border: '2px solid ' + (formData.allowed_menus.includes(menu.id) ? '#22C55E' : '#E5E7EB'),
                          transition: 'all 0.2s',
                          userSelect: 'none',
                          fontSize: '0.8rem'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          const newMenus = formData.allowed_menus.includes(menu.id)
                            ? formData.allowed_menus.filter(m => m !== menu.id)
                            : [...formData.allowed_menus, menu.id];
                          setFormData({ ...formData, allowed_menus: newMenus });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.allowed_menus.includes(menu.id)}
                          onChange={() => {}}
                          style={{ marginRight: '0.5rem', width: '16px', height: '16px', cursor: 'pointer' }}
                          readOnly
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: '500', flex: 1 }}>{menu.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="label" style={{ marginBottom: '0.75rem' }}>Plant Access</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.5rem' }}>
                    {['Plant-1', 'Plant-2', 'Plant-3'].map(plant => (
                      <label
                        key={plant}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          borderRadius: '0.375rem',
                          background: formData.allowed_plants.includes(plant) ? '#DBEAFE' : '#F9FAFB',
                          border: '2px solid ' + (formData.allowed_plants.includes(plant) ? '#3B82F6' : '#E5E7EB'),
                          transition: 'all 0.2s',
                          userSelect: 'none',
                          fontSize: '0.8rem'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          const newPlants = formData.allowed_plants.includes(plant)
                            ? formData.allowed_plants.filter(p => p !== plant)
                            : [...formData.allowed_plants, plant];
                          setFormData({ ...formData, allowed_plants: newPlants });
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.allowed_plants.includes(plant)}
                          onChange={() => {}}
                          style={{ marginRight: '0.5rem', width: '16px', height: '16px', cursor: 'pointer' }}
                          readOnly
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: '500', flex: 1 }}>{plant}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    className="button button-primary"
                    onClick={editingUser ? handleUpdateUser : handleAddUser}
                    style={{ flex: 1 }}
                  >
                    <Save size={20} />
                    {editingUser ? 'Update' : 'Simpan'}
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={cancelEdit}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        <div className="mobile-show" style={{ display: 'none' }}>
          {paginatedUsers.map(user => (
            <div key={user.id} style={{
              background: selectedUsers.has(user.id) ? '#EFF6FF' : 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{user.full_name}</div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>NIK: {user.username}</div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => toggleSelectUser(user.id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  background: user.role === 'admin' ? '#FEE2E2' : user.role === 'supervisor' ? '#DBEAFE' : user.role === 'manajer' ? '#FEF3C7' : '#F3F4F6',
                  color: user.role === 'admin' ? '#991B1B' : user.role === 'supervisor' ? '#1E40AF' : user.role === 'manajer' ? '#92400E' : '#374151'
                }}>
                  {getRoleLabel(user.role)}
                </span>

                <button
                  onClick={() => handleToggleActive(user)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    background: user.is_active ? '#D1FAE5' : '#FEE2E2',
                    color: user.is_active ? '#065F46' : '#991B1B'
                  }}
                >
                  {user.is_active ? 'Aktif' : 'Non-aktif'}
                </button>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.75rem' }}>
                <div>{user.permissions.length} permissions</div>
                <div>{user.allowed_menus?.length || 0} menu, {user.allowed_plants?.length || 0} plant</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => startEdit(user)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    borderRadius: '0.375rem',
                    background: '#DBEAFE',
                    color: '#1E40AF',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Edit2 size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                  Edit
                </button>
                {user.username !== 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: 'none',
                      borderRadius: '0.375rem',
                      background: '#FEE2E2',
                      color: '#991B1B',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    <Trash2 size={16} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="mobile-hide" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', width: '50px' }}>
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && selectedUsers.size === paginatedUsers.length}
                    onChange={toggleSelectAll}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>NIK</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Nama Lengkap</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Role</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Permissions</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #E5E7EB', background: selectedUsers.has(user.id) ? '#EFF6FF' : 'white' }}>
                  <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{user.username}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{user.full_name}</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      background: user.role === 'admin' ? '#FEE2E2' : user.role === 'supervisor' ? '#DBEAFE' : user.role === 'manajer' ? '#FEF3C7' : '#F3F4F6',
                      color: user.role === 'admin' ? '#991B1B' : user.role === 'supervisor' ? '#1E40AF' : user.role === 'manajer' ? '#92400E' : '#374151'
                    }}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                    <button
                      onClick={() => handleToggleActive(user)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        background: user.is_active ? '#D1FAE5' : '#FEE2E2',
                        color: user.is_active ? '#065F46' : '#991B1B'
                      }}
                    >
                      {user.is_active ? 'Aktif' : 'Non-aktif'}
                    </button>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#6B7280' }}>
                    <div>{user.permissions.length} permissions</div>
                    <div style={{ marginTop: '0.25rem' }}>
                      {user.allowed_menus?.length || 0} menu, {user.allowed_plants?.length || 0} plant
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => startEdit(user)}
                        style={{
                          padding: '0.5rem',
                          border: 'none',
                          borderRadius: '0.375rem',
                          background: '#DBEAFE',
                          color: '#1E40AF',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      {user.username !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          style={{
                            padding: '0.5rem',
                            border: 'none',
                            borderRadius: '0.375rem',
                            background: '#FEE2E2',
                            color: '#991B1B',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#F9FAFB',
            borderRadius: '0.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage === 1 ? '#E5E7EB' : '#3B82F6',
                color: currentPage === 1 ? '#9CA3AF' : 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <ChevronLeft size={16} />
              Prev
            </button>

            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      background: currentPage === pageNum ? '#3B82F6' : 'white',
                      color: currentPage === pageNum ? 'white' : '#374151',
                      border: '1px solid ' + (currentPage === pageNum ? '#3B82F6' : '#D1D5DB'),
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: currentPage === pageNum ? '600' : '400',
                      minWidth: '36px'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.5rem 1rem',
                background: currentPage === totalPages ? '#E5E7EB' : '#3B82F6',
                color: currentPage === totalPages ? '#9CA3AF' : 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {showCSVUpload && (
          <div className="popup-overlay" onClick={() => setShowCSVUpload(false)}>
            <div className="popup-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', width: '800px', maxHeight: '90vh', overflowY: 'auto', margin: '1rem' }}>
              <div className="popup-header">
                <h3>Import User dari CSV</h3>
                <button onClick={() => setShowCSVUpload(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="popup-body" style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#EFF6FF', borderRadius: '0.5rem', border: '1px solid #BFDBFE' }}>
                  <p style={{ fontSize: '0.875rem', color: '#1E40AF', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Format CSV:
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#1E40AF', fontFamily: 'monospace' }}>
                    nik,password,full_name,role,menus,plants
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#1E40AF', marginTop: '0.5rem' }}>
                    Role: admin | supervisor | qc_field | manajer
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#1E40AF' }}>
                    Menus: sanitasi_besar,kliping,monitoring_area,audit_internal
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#1E40AF' }}>
                    Plants: Plant-1,Plant-2,Plant-3
                  </p>
                </div>

                <div className="form-group">
                  <label className="label">Pilih File CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVFileChange}
                    className="input"
                  />
                </div>

                {csvErrors.length > 0 && (
                  <div style={{ marginTop: '1rem', padding: '1rem', background: '#FEE2E2', borderRadius: '0.5rem', border: '1px solid #FCA5A5' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#991B1B', marginBottom: '0.5rem' }}>
                      Error Validasi:
                    </p>
                    {csvErrors.map((error, index) => (
                      <p key={index} style={{ fontSize: '0.75rem', color: '#991B1B', marginBottom: '0.25rem' }}>
                        • {error}
                      </p>
                    ))}
                  </div>
                )}

                {csvPreview.length > 0 && csvErrors.length === 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Preview ({csvPreview.length} users):
                    </p>
                    <div style={{ overflowX: 'auto', maxHeight: '300px', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                        <thead style={{ background: '#F9FAFB', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>NIK</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Nama</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Role</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Menus</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #E5E7EB' }}>Plants</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.map((user, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #E5E7EB' }}>
                              <td style={{ padding: '0.5rem' }}>{user.nik}</td>
                              <td style={{ padding: '0.5rem' }}>{user.full_name}</td>
                              <td style={{ padding: '0.5rem' }}>{getRoleLabel(user.role)}</td>
                              <td style={{ padding: '0.5rem', fontSize: '0.625rem' }}>{user.menus}</td>
                              <td style={{ padding: '0.5rem', fontSize: '0.625rem' }}>{user.plants}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button
                    className="button button-primary"
                    onClick={handleImportCSV}
                    disabled={csvPreview.length === 0 || csvErrors.length > 0}
                    style={{ flex: 1, opacity: (csvPreview.length === 0 || csvErrors.length > 0) ? 0.5 : 1 }}
                  >
                    <Upload size={20} />
                    Import {csvPreview.length} Users
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => {
                      setShowCSVUpload(false);
                      setCSVPreview([]);
                      setCSVErrors([]);
                    }}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBulkUpdate && (
          <div className="popup-overlay" onClick={() => setShowBulkUpdate(false)}>
            <div className="popup-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', width: '700px', maxHeight: '90vh', overflowY: 'auto', margin: '1rem' }}>
              <div className="popup-header">
                <h3>Bulk Update {selectedUsers.size} Users</h3>
                <button onClick={() => setShowBulkUpdate(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="popup-body" style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#FEF3C7', borderRadius: '0.5rem', border: '1px solid #FDE68A' }}>
                  <p style={{ fontSize: '0.875rem', color: '#92400E', fontWeight: '500' }}>
                    Update akan diterapkan ke {selectedUsers.size} user yang dipilih.
                    Centang opsi yang ingin diupdate.
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bulkUpdateData.updatePermissions}
                      onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, updatePermissions: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Update Permissions</span>
                  </label>

                  {bulkUpdateData.updatePermissions && (
                    <div style={{ marginLeft: '2rem', marginBottom: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: '0.375rem', padding: '0.5rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                        {Object.entries(groupedPermissions).map(([category, perms]) => (
                          <div key={category}>
                            <p style={{ fontSize: '0.7rem', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                              {category}
                            </p>
                            {perms.map(perm => (
                              <label key={perm.permission_name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                                <input
                                  type="checkbox"
                                  checked={bulkUpdateData.permissions.includes(perm.permission_name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setBulkUpdateData({
                                        ...bulkUpdateData,
                                        permissions: [...bulkUpdateData.permissions, perm.permission_name]
                                      });
                                    } else {
                                      setBulkUpdateData({
                                        ...bulkUpdateData,
                                        permissions: bulkUpdateData.permissions.filter(p => p !== perm.permission_name)
                                      });
                                    }
                                  }}
                                />
                                <span style={{ fontSize: '0.75rem' }}>{perm.description}</span>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bulkUpdateData.updateMenus}
                      onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, updateMenus: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Update Menu Access</span>
                  </label>

                  {bulkUpdateData.updateMenus && (
                    <div style={{ marginLeft: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.5rem' }}>
                      {['sanitasi_besar', 'kliping', 'monitoring_area', 'audit_internal'].map(menu => (
                        <label key={menu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: bulkUpdateData.allowed_menus.includes(menu) ? '#D1FAE5' : '#F3F4F6', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <input
                            type="checkbox"
                            checked={bulkUpdateData.allowed_menus.includes(menu)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkUpdateData({
                                  ...bulkUpdateData,
                                  allowed_menus: [...bulkUpdateData.allowed_menus, menu]
                                });
                              } else {
                                setBulkUpdateData({
                                  ...bulkUpdateData,
                                  allowed_menus: bulkUpdateData.allowed_menus.filter(m => m !== menu)
                                });
                              }
                            }}
                          />
                          <span style={{ fontSize: '0.8rem' }}>
                            {menu === 'sanitasi_besar' ? 'Sanitasi Besar' :
                             menu === 'kliping' ? 'Kliping' :
                             menu === 'monitoring_area' ? 'Monitoring Area' :
                             'Audit Internal'}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={bulkUpdateData.updatePlants}
                      onChange={(e) => setBulkUpdateData({ ...bulkUpdateData, updatePlants: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Update Plant Access</span>
                  </label>

                  {bulkUpdateData.updatePlants && (
                    <div style={{ marginLeft: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                      {['Plant-1', 'Plant-2', 'Plant-3'].map(plant => (
                        <label key={plant} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: bulkUpdateData.allowed_plants.includes(plant) ? '#DBEAFE' : '#F3F4F6', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <input
                            type="checkbox"
                            checked={bulkUpdateData.allowed_plants.includes(plant)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkUpdateData({
                                  ...bulkUpdateData,
                                  allowed_plants: [...bulkUpdateData.allowed_plants, plant]
                                });
                              } else {
                                setBulkUpdateData({
                                  ...bulkUpdateData,
                                  allowed_plants: bulkUpdateData.allowed_plants.filter(p => p !== plant)
                                });
                              }
                            }}
                          />
                          <span style={{ fontSize: '0.8rem' }}>{plant}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="button button-primary"
                    onClick={handleBulkUpdate}
                    disabled={!bulkUpdateData.updatePermissions && !bulkUpdateData.updateMenus && !bulkUpdateData.updatePlants}
                    style={{ flex: 1, opacity: (!bulkUpdateData.updatePermissions && !bulkUpdateData.updateMenus && !bulkUpdateData.updatePlants) ? 0.5 : 1 }}
                  >
                    <Save size={20} />
                    Update {selectedUsers.size} Users
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={() => setShowBulkUpdate(false)}
                    style={{ flex: 1 }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-hide {
            display: none !important;
          }
          .mobile-show {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-hide {
            display: block !important;
          }
          .mobile-show {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
