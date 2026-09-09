import { useState, useEffect } from 'react';
import {
  Users, UserPlus, Edit2, Trash2, Shield,
  Search, Filter, X, AlertCircle, CheckCircle2, Lock, Phone, Mail, ArrowLeft
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

export default function UserManagerTab({ user }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // User Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    pin_code: '1234',
    role: 'STUDENT',
    is_active: true,
    bio: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadUsersAndBatches();
  }, []);

  const loadUsersAndBatches = async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([
        api.getUsers(),
        api.getBatches(),
      ]);
      setUsers(Array.isArray(uRes) ? uRes : (uRes.results || []));
      setBatches(Array.isArray(bRes) ? bRes : (bRes.results || []));
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'form'

  const handleOpenCreate = (defaultRole = 'STUDENT') => {
    setEditingUser(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      mobile_number: '',
      pin_code: '1234',
      role: defaultRole,
      is_active: true,
      bio: '',
      password: '',
    });
    setFieldErrors({});
    setErrorMsg('');
    setViewMode('form');
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      mobile_number: u.mobile_number || '',
      pin_code: u.pin_code || '',
      role: u.role,
      is_active: u.is_active,
      bio: u.bio || '',
      password: '',
    });
    setFieldErrors({});
    setErrorMsg('');
    setViewMode('form');
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.first_name || !formData.first_name.trim()) {
      errs.first_name = 'First name is required.';
    }
    if (!formData.mobile_number || !formData.mobile_number.trim()) {
      errs.mobile_number = 'Mobile number is required for student/staff login.';
    } else if (formData.mobile_number.trim().length < 6) {
      errs.mobile_number = 'Enter a valid mobile number (min 6 digits).';
    }
    if (!editingUser && (!formData.password || formData.password.length < 4)) {
      errs.password = 'Password must be at least 4 characters for new user accounts.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setErrorMsg('Please fill in all mandatory fields highlighted in red below.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const payload = { ...formData };
      if (!payload.username.trim()) {
        payload.username = payload.mobile_number.trim();
      }
      if (editingUser) {
        await api.updateUser(editingUser.id, payload);
      } else {
        await api.createUser(payload);
      }
      setViewMode('list');
      await loadUsersAndBatches();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save user account.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    const ok = await confirm({
      title: 'Delete User Account?',
      message: `Are you sure you want to delete user "${name}"? This action cannot be undone.`,
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      type: 'danger',
    });
    if (!ok) return;

    try {
      await api.deleteUser(id);
      toast.success(`User "${name}" deleted successfully.`);
      await loadUsersAndBatches();
    } catch (e) {
      toast.error(e);
    }
  };

  const handleToggleActive = async (u) => {
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      await loadUsersAndBatches();
    } catch (e) {
      alert(e.message || 'Failed to toggle account active status');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = u.username.toLowerCase().includes(q) ||
                          u.first_name?.toLowerCase().includes(q) ||
                          u.last_name?.toLowerCase().includes(q) ||
                          u.email?.toLowerCase().includes(q) ||
                          u.mobile_number?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // DEDICATED IN-PAGE USER CREATION / EDIT VIEW
  if (viewMode === 'form') {
    const previewName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || 'User Name Preview';
    const previewInitial = (formData.first_name || formData.username || 'U')[0].toUpperCase();

    return (
      <div className="tab-pane-container animate-fade-in">
        {/* Top Header with Back Action */}
        <div className="tab-pane-header">
          <div className="flex items-center gap-3">
            <button
              className="btn-outline-sm"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} /> Back to Users
            </button>
            <div>
              <h2>{editingUser ? `Edit Account: ${editingUser.display_name}` : 'Create New User Account'}</h2>
              <p className="text-muted">
                {editingUser ? 'Update personal details, authentication credentials, and role privileges.' : 'Add a new student learner or staff trainer account to the platform.'}
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="alert-box danger mb-4 flex items-center gap-2 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveUser}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Form Fields */}
            <div className="lg:col-span-2 space-y-5">
              {/* Account Identity Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>1. Personal Identity & Role</h3>
                    <p className="text-muted">Core profile details and platform permissions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <label>Account Role *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'STUDENT', label: 'Student / Learner', desc: 'Can access assigned batches, compile code, and view topic notes.' },
                        { id: 'STAFF', label: 'Staff Trainer', desc: 'Can log daily batch sessions, grade code, and manage modules.' },
                        { id: 'ADMIN', label: 'Admin / Owner', desc: 'Full system privileges, user management, and curriculum control.' }
                      ].map(r => (
                        <div
                          key={r.id}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.role === r.id
                              ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                              : 'border-border-subtle bg-white dark:bg-slate-900 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, role: r.id })}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{r.label}</span>
                            {formData.role === r.id && <CheckCircle2 size={16} className="text-primary" />}
                          </div>
                          <p className="text-[11px] text-muted mt-1 leading-snug">{r.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex"
                        value={formData.first_name}
                        onChange={(e) => {
                          setFormData({ ...formData, first_name: e.target.value });
                          if (fieldErrors.first_name) setFieldErrors({ ...fieldErrors, first_name: '' });
                        }}
                        className={`form-input ${fieldErrors.first_name ? 'input-error' : ''}`}
                      />
                      {fieldErrors.first_name && (
                        <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.first_name}</span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Kumar"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Mobile Number (Primary Login ID) *</label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210"
                        value={formData.mobile_number}
                        onChange={(e) => {
                          setFormData({ ...formData, mobile_number: e.target.value });
                          if (fieldErrors.mobile_number) setFieldErrors({ ...fieldErrors, mobile_number: '' });
                        }}
                        className={`form-input ${fieldErrors.mobile_number ? 'input-error' : ''}`}
                      />
                      {fieldErrors.mobile_number && (
                        <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.mobile_number}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="e.g. alex@skillstack.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Username (Optional, defaults to Mobile Number)</label>
                    <input
                      type="text"
                      placeholder="Leave blank to use mobile number as username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* Security & Access Credentials Card */}
              <div className="dashboard-section-card">
                <div className="section-card-header">
                  <div>
                    <h3>2. Security & Login Access</h3>
                    <p className="text-muted">Password credentials and rapid-access PIN code</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>
                        {editingUser ? 'New Password (leave blank to retain current)' : 'Account Password *'}
                      </label>
                      <input
                        type="password"
                        placeholder={editingUser ? 'Enter new password only if changing' : 'Minimum 4 characters'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                        }}
                        className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                      />
                      {fieldErrors.password && (
                        <span className="field-error-msg"><AlertCircle size={13} /> {fieldErrors.password}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>PIN Code (Quick Access for Lab Terminals)</label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 1234"
                        value={formData.pin_code}
                        onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
                        className="form-input font-mono"
                      />
                      <span className="form-hint">Used for 4-digit rapid sign-in on student lab workstations</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Trainer Notes / Student Profile Bio</label>
                    <textarea
                      rows={3}
                      placeholder="Academic background, batch preferences, or specific notes..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="form-textarea"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-sm">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      />
                      <span>Account Active & Enabled for Sign In</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live User Profile Card Preview */}
            <div className="space-y-5">
              <div className="dashboard-section-card sticky top-24">
                <div className="section-card-header">
                  <div>
                    <h3>User Card Preview</h3>
                    <p className="text-muted">How this user profile appears</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border-subtle bg-slate-50 dark:bg-slate-800/50 space-y-4 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
                    {previewInitial}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-white">{previewName}</h4>
                    <p className="text-xs text-muted">@{formData.username || formData.mobile_number || 'username'}</p>
                    <span className={`inline-block mt-2 badge-pill ${formData.role === 'ADMIN' ? 'purple' : formData.role === 'STAFF' ? 'info' : 'success'}`}>
                      {formData.role}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-border-subtle text-left text-xs space-y-1 text-muted">
                    {formData.mobile_number && (
                      <div className="flex items-center gap-1.5"><Phone size={12} /> {formData.mobile_number}</div>
                    )}
                    {formData.email && (
                      <div className="flex items-center gap-1.5"><Mail size={12} /> {formData.email}</div>
                    )}
                    {formData.pin_code && (
                      <div className="flex items-center gap-1.5 font-mono"><Lock size={12} /> Terminal PIN: {formData.pin_code}</div>
                    )}
                  </div>
                </div>

                <div className="preview-action-buttons">
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving Account…' : (editingUser ? 'Save User Changes' : 'Create User Account')}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setViewMode('list')}>
                    Cancel & Return
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="tab-pane-container">
      {/* Header */}
      <div className="tab-pane-header">
        <div>
          <h2>User Accounts & Permissions</h2>
          <p className="text-muted">
            Manage admin managers, staff trainers, and student accounts. Assign roles and configure sign-in credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => handleOpenCreate('STAFF')}>
            <UserPlus size={16} /> Add Staff Trainer
          </button>
          <button className="btn-primary" onClick={() => handleOpenCreate('STUDENT')}>
            <UserPlus size={16} /> Enroll New Student
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-unified">
        <div className="filter-search-box">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            placeholder="Search by name, username, mobile, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-dropdown-wrap">
          <Filter size={15} className="text-muted" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select-modern"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="ADMIN">Admin Only</option>
            <option value="STAFF">Staff Trainers Only</option>
            <option value="STUDENT">Students Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="dashboard-section-card mt-4">
        {loading ? (
          <div className="loading-state">Loading user directory…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state-modern">
            <div className="empty-icon-bubble">
              <Users size={32} />
            </div>
            <h3>No Users Found</h3>
            <p>No user accounts match your search or filter. Create student or staff accounts to populate the directory.</p>
            <button className="btn-save-primary mt-2" onClick={() => handleOpenCreate('STUDENT')}>
              <UserPlus size={16} /> Enroll New Student
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Contact Info</th>
                  <th>Enrolled / Assigned Batches</th>
                  <th>Status</th>
                  <th style={{ width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className={`avatar-sm ${u.role === 'ADMIN' ? 'bg-purple-600' : u.role === 'STAFF' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                          {(u.first_name || u.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{u.display_name}</div>
                          <div className="text-xs text-muted">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge-pill ${
                        u.role === 'ADMIN' ? 'purple' : u.role === 'STAFF' ? 'info' : 'success'
                      }`}>
                        {u.role === 'ADMIN' ? 'Admin / Owner' : u.role === 'STAFF' ? 'Staff Trainer' : 'Student'}
                      </span>
                    </td>
                    <td>
                      <div className="text-xs space-y-0.5">
                        {u.email && <div className="flex items-center gap-1 text-muted"><Mail size={11} />{u.email}</div>}
                        {u.mobile_number && <div className="flex items-center gap-1 font-mono"><Phone size={11} />{u.mobile_number}</div>}
                      </div>
                    </td>
                    <td>
                      <div className="text-xs space-y-1">
                        {u.role === 'STAFF' && u.assigned_batches_list?.length > 0 ? (
                          u.assigned_batches_list.map(b => (
                            <span key={b.id} className="badge-pill trainer-pill mr-1 mb-1 inline-block">
                              {b.name}
                            </span>
                          ))
                        ) : u.role === 'STUDENT' && u.enrolled_batches_list?.length > 0 ? (
                          u.enrolled_batches_list.map(b => (
                            <span key={b.id} className="badge-pill course-pill mr-1 mb-1 inline-block">
                              {b.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted italic">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className={`badge-pill cursor-pointer ${u.is_active ? 'success' : 'secondary'}`}
                        onClick={() => handleToggleActive(u)}
                        title="Click to toggle active state"
                      >
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="icon-btn" onClick={() => handleOpenEdit(u)} title="Edit user">
                          <Edit2 size={13} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDeleteUser(u.id, u.display_name)} title="Delete user">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
