import React, { useState, useEffect, useCallback } from 'react';
import {
  listDisputes, getDispute, assignDispute, adjudicateDispute, closeDispute,
  sendDisputeMessage, listCommissions, getCommission,
  login, logout, isLoggedIn,
  adminSearchUsers, adminGetUserDetail, adminSuspendUser, adminUnsuspendUser,
  adminWarnUser, adminSoftDeleteUser, adminPermanentlyDeleteUser,
  adminListChats, adminGetOrCreateChat, adminGetChatRoom, adminSendChatMessage,
} from './api';

// ── Shared Styles ──
const S = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  sidebar: { width: 240, background: '#1a1625', borderRight: '1px solid #2a2540', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10 },
  main: { flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column' },
  content: { flex: 1, padding: 24, maxWidth: 1200, width: '100%' },
  topBar: { padding: '16px 24px', background: '#1a1625', borderBottom: '1px solid #2a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 20, fontWeight: 700, color: '#9c6fd6' },
  logoSub: { fontSize: 11, color: '#705e8a' },
  nav: { flex: 1, padding: '16px 0' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', color: '#b09ac0', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.15s', borderLeft: '3px solid transparent' },
  navItemActive: { color: '#9c6fd6', background: 'rgba(156,111,214,0.08)', borderLeftColor: '#9c6fd6' },
  navBadge: { marginLeft: 'auto', background: '#9c6fd6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10 },
  card: { background: '#1e1830', border: '1px solid #2a2540', borderRadius: 12, padding: 20 },
  cardHover: { cursor: 'pointer', transition: 'all 0.15s' },
  badge: { display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  badgeOpen: { background: 'rgba(245,166,35,0.15)', color: '#f5a623' },
  badgeUnderReview: { background: 'rgba(74,130,168,0.15)', color: '#4a82a8' },
  badgeResolved: { background: 'rgba(90,158,90,0.15)', color: '#5a9e5a' },
  badgeClosed: { background: 'rgba(102,102,102,0.15)', color: '#888' },
  badgeDisputed: { background: 'rgba(214,69,80,0.15)', color: '#d64550' },
  badgeDeleted: { background: 'rgba(168,85,247,0.15)', color: '#a855f7' },
  badgeSuspended: { background: 'rgba(234,88,12,0.15)', color: '#ea580c' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: '#705e8a', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid #2a2540' },
  td: { padding: '12px', borderBottom: '1px solid #2a2540', color: '#b09ac0', fontSize: 13 },
  trHover: { cursor: 'pointer', transition: 'background 0.1s' },
  btn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
  btnPrimary: { background: '#9c6fd6', color: '#fff' },
  btnSuccess: { background: '#2e7d32', color: '#fff' },
  btnDanger: { background: 'rgba(214,69,80,0.2)', color: '#d64550', border: '1px solid rgba(214,69,80,0.3)' },
  btnWarning: { background: 'rgba(234,88,12,0.2)', color: '#ea580c', border: '1px solid rgba(234,88,12,0.3)' },
  btnSecondary: { background: '#2a2540', color: '#b09ac0', border: '1px solid #3a3550' },
  btnSm: { padding: '5px 10px', fontSize: 12 },
  input: { width: '100%', padding: '9px 12px', background: '#15121f', border: '1px solid #2a2540', borderRadius: 8, color: '#e8e3f0', fontSize: 13, outline: 'none' },
  textarea: { width: '100%', padding: '9px 12px', background: '#15121f', border: '1px solid #2a2540', borderRadius: 8, color: '#e8e3f0', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 80, fontFamily: 'inherit' },
  select: { padding: '9px 12px', background: '#15121f', border: '1px solid #2a2540', borderRadius: 8, color: '#e8e3f0', fontSize: 13, outline: 'none' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 },
  statCard: { background: '#1e1830', border: '1px solid #2a2540', borderRadius: 12, padding: 16 },
  statVal: { fontSize: 28, fontWeight: 700 },
  statLabel: { fontSize: 11, color: '#705e8a', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  msgBubble: { maxWidth: '75%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.5 },
  msgOwn: { background: '#9c6fd6', color: '#fff', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  msgOther: { background: '#2a2540', color: '#e8e3f0', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgMediator: { background: 'rgba(13,115,119,0.2)', color: '#e8e3f0', alignSelf: 'flex-start', borderBottomLeftRadius: 4, border: '1px solid rgba(13,115,119,0.3)' },
  divider: { border: 'none', borderTop: '1px solid #2a2540', margin: '16px 0' },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: '#705e8a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  empty: { textAlign: 'center', padding: '40px 20px', color: '#705e8a' },
  errorBox: { background: 'rgba(214,69,80,0.1)', border: '1px solid rgba(214,69,80,0.3)', borderRadius: 8, padding: 12, color: '#d64550', fontSize: 13 },
  successBox: { background: 'rgba(90,158,90,0.1)', border: '1px solid rgba(90,158,90,0.3)', borderRadius: 8, padding: 12, color: '#5a9e5a', fontSize: 13 },
};

function getBadgeStyle(status) {
  const map = { open: S.badgeOpen, under_review: S.badgeUnderReview, resolved: S.badgeResolved, closed: S.badgeClosed };
  return map[status] || S.badgeClosed;
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
}

// ── Login Page ──
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.role !== 'admin') {
        setError('Access denied. Admin role required.');
        logout();
        return;
      }
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed.');
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0d1a', padding: 20 }}>
      <div style={{ ...S.card, width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🐾</div>
          <div style={S.logo}>Ruffl Admin</div>
          <div style={S.logoSub}>Admin Dashboard</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#705e8a', marginBottom: 5 }}>Email</label>
            <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ruffl.app" required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#705e8a', marginBottom: 5 }}>Password</label>
            <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div style={{ ...S.errorBox, marginBottom: 14 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn, ...S.btnPrimary, width: '100%', justifyContent: 'center', padding: 12 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function UsersPage({ onViewUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTimer, setSearchTimer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminSearchUsers(search, filter);
      setUsers(data.data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  function handleSearchChange(val) {
    setSearch(val);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => {
      load();
    }, 300);
    setSearchTimer(t);
  }

  return (
    <div style={S.content}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e3f0' }}>Users</h1>
        <p style={{ fontSize: 13, color: '#705e8a', marginTop: 2 }}>Search, manage, and moderate user accounts</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Search by username, email, or ID…"
        />
        <select style={{ ...S.select, width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {error && <div style={{ ...S.errorBox, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={S.empty}>Loading users…</div>
      ) : users.length === 0 ? (
        <div style={S.empty}>No users found.</div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>User</th>
                <th style={S.th}>Role</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={S.trHover} onClick={() => onViewUser(u.id)}
                    onMouseEnter={e => e.currentTarget.style.background = '#231d38'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600, color: '#e8e3f0' }}>{u.username}</div>
                    <div style={{ fontSize: 11, color: '#705e8a' }}>{u.email || '—'}</div>
                  </td>
                  <td style={S.td}>{u.role}</td>
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {u.is_deleted && <span style={{ ...S.badge, ...S.badgeDeleted }}>Deleted</span>}
                      {u.is_suspended && <span style={{ ...S.badge, ...S.badgeSuspended }}>Suspended</span>}
                      {!u.is_deleted && !u.is_suspended && <span style={{ ...S.badge, ...S.badgeResolved }}>Active</span>}
                    </div>
                  </td>
                  <td style={S.td}>{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── User Detail Page ──
function UserDetailPage({ userId, onBack, onMessageUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Action modals
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendHours, setSuspendHours] = useState(24);
  const [suspendReason, setSuspendReason] = useState('');
  const [showWarn, setShowWarn] = useState(false);
  const [warnMessage, setWarnMessage] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [showPermDelete, setShowPermDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetUserDetail(userId);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [userId]);

  function handleMessageUser() {
    adminGetOrCreateChat(userId).then(res => {
      if (onMessageUser) {
        onMessageUser(res.data.id);
      }
    }).catch(err => { setError(err.message); });
  }

  useEffect(() => { load(); }, [load]);

  async function handleSuspend() {
    setActionLoading(true);
    try {
      await adminSuspendUser(userId, suspendHours, suspendReason);
      setShowSuspend(false);
      setSuspendReason('');
      await load();
    } catch (err) { setError(err.message); }
    setActionLoading(false);
  }

  async function handleUnsuspend() {
    setActionLoading(true);
    try {
      await adminUnsuspendUser(userId);
      await load();
    } catch (err) { setError(err.message); }
    setActionLoading(false);
  }

  async function handleWarn() {
    if (!warnMessage.trim()) return;
    setActionLoading(true);
    try {
      await adminWarnUser(userId, warnMessage.trim());
      setShowWarn(false);
      setWarnMessage('');
      await load();
    } catch (err) { setError(err.message); }
    setActionLoading(false);
  }

  async function handleSoftDelete() {
    setActionLoading(true);
    try {
      await adminSoftDeleteUser(userId);
      setShowDelete(false);
      await load();
    } catch (err) { setError(err.message); }
    setActionLoading(false);
  }

  async function handlePermDelete() {
    setActionLoading(true);
    try {
      await adminPermanentlyDeleteUser(userId);
      setShowPermDelete(false);
      onBack();
    } catch (err) { setError(err.message); }
    setActionLoading(false);
  }

  if (loading && !data) return <div style={{ ...S.content, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>;
  if (!data) return <div style={S.content}><div style={S.errorBox}>{error || 'Not found.'}</div></div>;

  const tabs = ['overview', 'commissions', 'disputes', 'warnings'];

  return (
    <div style={S.content}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...S.btn, ...S.btnSecondary, marginBottom: 12 }}>← Back to Users</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e3f0' }}>
              {data.username}
              {data.is_deleted && <span style={{ ...S.badge, ...S.badgeDeleted, marginLeft: 8 }}>Deleted</span>}
              {data.is_suspended && <span style={{ ...S.badge, ...S.badgeSuspended, marginLeft: 8 }}>Suspended</span>}
            </h1>
            <div style={{ fontSize: 13, color: '#705e8a', marginTop: 4 }}>
              {data.email || '—'} · Role: {data.role} · ID: {data.id.slice(0, 8)}…
            </div>
          </div>
        </div>
      </div>

      {error && <div style={{ ...S.errorBox, marginBottom: 16 }}>{error}</div>}

      {/* Action buttons */}
      {!data.is_deleted && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {data.is_suspended ? (
            <button onClick={handleUnsuspend} disabled={actionLoading} style={{ ...S.btn, ...S.btnSuccess }}>✅ Unsuspend</button>
          ) : (
            <button onClick={() => setShowSuspend(true)} disabled={actionLoading} style={{ ...S.btn, ...S.btnWarning }}>🔒 Suspend</button>
          )}
          <button onClick={() => setShowWarn(true)} disabled={actionLoading} style={{ ...S.btn, ...S.btnSecondary }}>⚠️ Send Warning</button>
          <button onClick={handleMessageUser} disabled={actionLoading} style={{ ...S.btn, ...S.btnPrimary }}>💬 Message User</button>
          <button onClick={() => setShowDelete(true)} disabled={actionLoading} style={{ ...S.btn, ...S.btnDanger }}>🗑️ Delete Account</button>
        </div>
      )}
      {data.is_deleted && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={handleMessageUser} disabled={actionLoading} style={{ ...S.btn, ...S.btnPrimary }}>💬 Message User</button>
          <button onClick={() => setShowPermDelete(true)} disabled={actionLoading} style={{ ...S.btn, ...S.btnDanger }}>💀 Permanent Delete</button>
        </div>
      )}

      {/* Suspend modal */}
      {showSuspend && (
        <div style={{ ...S.card, marginBottom: 16, border: '1px solid rgba(234,88,12,0.3)' }}>
          <div style={S.sectionTitle}>Suspend User</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#705e8a', marginBottom: 5 }}>Duration (hours)</label>
            <select style={S.select} value={suspendHours} onChange={e => setSuspendHours(Number(e.target.value))}>
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={24}>24 hours</option>
              <option value={72}>3 days</option>
              <option value={168}>7 days</option>
              <option value={720}>30 days</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#705e8a', marginBottom: 5 }}>Reason (optional)</label>
            <textarea style={S.textarea} value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Reason for suspension…" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSuspend} disabled={actionLoading} style={{ ...S.btn, ...S.btnWarning }}>
              {actionLoading ? 'Suspending…' : 'Confirm Suspension'}
            </button>
            <button onClick={() => setShowSuspend(false)} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Warn modal */}
      {showWarn && (
        <div style={{ ...S.card, marginBottom: 16, border: '1px solid rgba(245,166,35,0.3)' }}>
          <div style={S.sectionTitle}>Send Warning</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#705e8a', marginBottom: 5 }}>Warning Message *</label>
            <textarea style={S.textarea} value={warnMessage} onChange={e => setWarnMessage(e.target.value)} placeholder="This message will be shown to the user when they open the app…" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleWarn} disabled={actionLoading || !warnMessage.trim()} style={{ ...S.btn, ...S.btnPrimary }}>
              {actionLoading ? 'Sending…' : 'Send Warning'}
            </button>
            <button onClick={() => setShowWarn(false)} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Soft delete modal */}
      {showDelete && (
        <div style={{ ...S.card, marginBottom: 16, border: '1px solid rgba(214,69,80,0.3)' }}>
          <div style={S.sectionTitle}>⚠️ Delete Account</div>
          <p style={{ fontSize: 13, color: '#b09ac0', marginBottom: 12 }}>
            This will anonymize the user's account. Their data will be retained for fraud prevention.
            The account will be marked as "deleted" with the deletion date.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSoftDelete} disabled={actionLoading} style={{ ...S.btn, ...S.btnDanger }}>
              {actionLoading ? 'Deleting…' : 'Confirm Delete'}
            </button>
            <button onClick={() => setShowDelete(false)} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Permanent delete modal */}
      {showPermDelete && (
        <div style={{ ...S.card, marginBottom: 16, border: '2px solid #d64550' }}>
          <div style={S.sectionTitle}>💀 Permanent Deletion</div>
          <p style={{ fontSize: 13, color: '#d64550', marginBottom: 12, fontWeight: 600 }}>
            This action is IRREVERSIBLE. All user data will be permanently erased.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handlePermDelete} disabled={actionLoading} style={{ ...S.btn, ...S.btnDanger }}>
              {actionLoading ? 'Deleting…' : '⚠️ PERMANENTLY DELETE'}
            </button>
            <button onClick={() => setShowPermDelete(false)} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2540', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 16px', background: 'none', border: 'none',
            color: tab === t ? '#9c6fd6' : '#705e8a', fontSize: 13,
            fontWeight: tab === t ? 600 : 500, cursor: 'pointer',
            borderBottom: tab === t ? '2px solid #9c6fd6' : '2px solid transparent', marginBottom: -1,
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'warnings' && data.warnings?.length > 0 && (
              <span style={{ marginLeft: 4, background: '#d64550', color: '#fff', fontSize: 9, padding: '1px 5px', borderRadius: 8 }}>{data.warnings.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={S.statCard}>
            <div style={S.statLabel}>Role</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e8e3f0', marginTop: 4 }}>{data.role}</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Commissions</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e8e3f0', marginTop: 4 }}>{data.commissions?.length || 0}</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Disputes</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e8e3f0', marginTop: 4 }}>{data.disputes?.length || 0}</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Warnings</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e8e3f0', marginTop: 4 }}>{data.warnings?.length || 0}</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Joined</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e3f0', marginTop: 4 }}>{formatDate(data.created_at)}</div>
          </div>
          {data.deleted_at && (
            <div style={S.statCard}>
              <div style={S.statLabel}>Deleted At</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#d64550', marginTop: 4 }}>{formatDate(data.deleted_at)}</div>
            </div>
          )}
          {data.suspended_until && (
            <div style={S.statCard}>
              <div style={S.statLabel}>Suspended Until</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ea580c', marginTop: 4 }}>{formatDate(data.suspended_until)}</div>
            </div>
          )}
        </div>
      )}

      {/* Commissions tab */}
      {tab === 'commissions' && (
        <div>
          {(!data.commissions || data.commissions.length === 0) ? (
            <div style={S.empty}>No commissions found.</div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Title</th>
                    <th style={S.th}>Parties</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Amount</th>
                    <th style={S.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data.commissions.map(c => (
                    <tr key={c.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: '#e8e3f0' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: '#705e8a' }}>{c.id.slice(0, 8)}…</div>
                      </td>
                      <td style={S.td}>{c.maker_name} / {c.commissioner_name}</td>
                      <td style={S.td}><span style={{ ...S.badge, ...getBadgeStyle(c.status) }}>{c.status}</span></td>
                      <td style={S.td}>£{Number(c.total_amount || 0).toFixed(2)}</td>
                      <td style={S.td}>{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Disputes tab */}
      {tab === 'disputes' && (
        <div>
          {(!data.disputes || data.disputes.length === 0) ? (
            <div style={S.empty}>No disputes found.</div>
          ) : (
            <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Commission</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Resolution</th>
                    <th style={S.th}>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.disputes.map(d => (
                    <tr key={d.id}>
                      <td style={S.td}>
                        <div style={{ fontWeight: 600, color: '#e8e3f0' }}>{d.commission_title}</div>
                        <div style={{ fontSize: 11, color: '#705e8a' }}>{d.id.slice(0, 8)}…</div>
                      </td>
                      <td style={S.td}><span style={{ ...S.badge, ...getBadgeStyle(d.status) }}>{d.status.replace('_', ' ')}</span></td>
                      <td style={S.td}>{d.resolution ? d.resolution.replace(/_/g, ' ') : '—'}</td>
                      <td style={S.td}>{formatDate(d.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Warnings tab */}
      {tab === 'warnings' && (
        <div>
          {(!data.warnings || data.warnings.length === 0) ? (
            <div style={S.empty}>No warnings issued.</div>
          ) : (
            data.warnings.map(w => (
              <div key={w.id} style={{ ...S.card, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, color: '#e8e3f0' }}>{w.admin_name}</span>
                  <span style={{ fontSize: 11, color: '#705e8a' }}>{formatDate(w.created_at)}</span>
                  {w.is_read && <span style={{ ...S.badge, ...S.badgeResolved, fontSize: 9 }}>Read</span>}
                  {!w.is_read && <span style={{ ...S.badge, ...S.badgeOpen, fontSize: 9 }}>Unread</span>}
                </div>
                <p style={{ fontSize: 13, color: '#b09ac0', lineHeight: 1.6 }}>{w.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CHATS TAB
// ═══════════════════════════════════════════════════════════════════════════════

function AdminChatsPage({ onViewChat }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminListChats();
      setChats(data.data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={S.content}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e3f0' }}>Admin Chats</h1>
        <p style={{ fontSize: 13, color: '#705e8a', marginTop: 2 }}>Direct messages with users</p>
      </div>

      {error && <div style={{ ...S.errorBox, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={S.empty}>Loading chats…</div>
      ) : chats.length === 0 ? (
        <div style={S.empty}>No admin chats yet.</div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>User</th>
                <th style={S.th}>Subject</th>
                <th style={S.th}>Last Message</th>
                <th style={S.th}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {chats.map(c => (
                <tr key={c.id} style={S.trHover} onClick={() => onViewChat(c.id)}
                    onMouseEnter={e => e.currentTarget.style.background = '#231d38'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600, color: '#e8e3f0' }}>
                      {c.user_name}
                      {c.deleted_at && <span style={{ ...S.badge, ...S.badgeDeleted, marginLeft: 4, fontSize: 9 }}>Deleted</span>}
                    </div>
                  </td>
                  <td style={S.td}>{c.subject || '—'}</td>
                  <td style={S.td}>{c.last_message || 'No messages'}</td>
                  <td style={S.td}>{formatDate(c.last_message_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Admin Chat Room Page ──
function AdminChatRoomPage({ roomId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminGetChatRoom(roomId);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => { load(); }, [load]);

  // Poll for live updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await adminGetChatRoom(roomId);
        setData(res.data);
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  async function handleSend() {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      await adminSendChatMessage(roomId, msgText.trim());
      setMsgText('');
      await load();
    } catch (err) { setError(err.message); }
    setSending(false);
  }

  if (loading && !data) return <div style={{ ...S.content, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>;
  if (!data) return <div style={S.content}><div style={S.errorBox}>{error || 'Not found.'}</div></div>;

  const messages = data.messages || [];
  const adminUserId = localStorage.getItem('ruffl_admin_user_id');

  return (
    <div style={S.content}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...S.btn, ...S.btnSecondary, marginBottom: 12 }}>← Back to Chats</button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e3f0' }}>
          Chat with User
          {data.subject && <span style={{ fontSize: 14, color: '#705e8a', fontWeight: 400, marginLeft: 8 }}>— {data.subject}</span>}
        </h1>
      </div>

      {error && <div style={{ ...S.errorBox, marginBottom: 16 }}>{error}</div>}

      <div style={{ ...S.card, marginBottom: 12, maxHeight: 400, overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ ...S.empty, padding: 20 }}>No messages yet.</div>
        ) : messages.map(m => {
          const isAdmin = m.role === 'admin';
          const isOwn = m.sender_id === adminUserId;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                <span style={{ fontSize: 11, color: '#705e8a' }}>{m.username}</span>
                {isAdmin && <span style={{ ...S.badge, background: 'rgba(13,115,119,0.2)', color: '#0d7377', fontSize: 9 }}>Admin</span>}
              </div>
              <div style={{ ...S.msgBubble, ...(isOwn ? S.msgOwn : isAdmin ? S.msgMediator : S.msgOther) }}>
                {m.content}
              </div>
              <span style={{ fontSize: 10, color: '#705e8a', marginTop: 2 }}>{formatDate(m.sent_at)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...S.input, flex: 1 }} value={msgText} onChange={e => setMsgText(e.target.value)}
               placeholder="Type a message…" onKeyDown={e => e.key === 'Enter' && handleSend()} />
        <button onClick={handleSend} disabled={sending || !msgText.trim()} style={{ ...S.btn, ...S.btnPrimary }}>Send</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPUTES TAB (unchanged from original)
// ═══════════════════════════════════════════════════════════════════════════════

function DisputeListPage({ onViewDispute }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listDisputes();
      setDisputes(data.data || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? disputes : disputes.filter(d => d.status === filter);

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    underReview: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
  };

  return (
    <div style={S.content}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e3f0' }}>Disputes</h1>
          <p style={{ fontSize: 13, color: '#705e8a', marginTop: 2 }}>Manage and adjudicate commission disputes</p>
        </div>
        <select style={{ ...S.select, width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All ({stats.total})</option>
          <option value="open">Open ({stats.open})</option>
          <option value="under_review">Under Review ({stats.underReview})</option>
          <option value="resolved">Resolved ({stats.resolved})</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div style={S.statsRow}>
        <div style={S.statCard}><div style={{ ...S.statVal, color: '#f5a623' }}>{stats.open}</div><div style={S.statLabel}>Open</div></div>
        <div style={S.statCard}><div style={{ ...S.statVal, color: '#4a82a8' }}>{stats.underReview}</div><div style={S.statLabel}>Under Review</div></div>
        <div style={S.statCard}><div style={{ ...S.statVal, color: '#5a9e5a' }}>{stats.resolved}</div><div style={S.statLabel}>Resolved</div></div>
        <div style={S.statCard}><div style={S.statVal}>{stats.total}</div><div style={S.statLabel}>Total</div></div>
      </div>

      {error && <div style={{ ...S.errorBox, marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div style={S.empty}>Loading disputes…</div>
      ) : filtered.length === 0 ? (
        <div style={S.empty}>No disputes found.</div>
      ) : (
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Commission</th>
                <th style={S.th}>Parties</th>
                <th style={S.th}>Raised By</th>
                <th style={S.th}>Status</th>
                <th style={S.th}>Updated</th>
                <th style={S.th}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={S.trHover} onClick={() => onViewDispute(d.id)}
                    onMouseEnter={e => e.currentTarget.style.background = '#231d38'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600, color: '#e8e3f0' }}>{d.commission_title}</div>
                    <div style={{ fontSize: 11, color: '#705e8a' }}>{d.id.slice(0, 8)}…</div>
                  </td>
                  <td style={S.td}><div>{d.maker_name} <span style={{ color: '#705e8a' }}>vs</span> {d.commissioner_name}</div></td>
                  <td style={S.td}>{d.raised_by_name}</td>
                  <td style={S.td}><span style={{ ...S.badge, ...getBadgeStyle(d.status) }}>{d.status.replace('_', ' ')}</span></td>
                  <td style={S.td}>{formatDate(d.updated_at)}</td>
                  <td style={S.td}>£{Number(d.total_amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DisputeDetailPage({ disputeId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('evidence');
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [showAdjudicate, setShowAdjudicate] = useState(false);
  const [resolution, setResolution] = useState('');
  const [resolutionMsg, setResolutionMsg] = useState('');
  const [adjudicating, setAdjudicating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDispute(disputeId);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [disputeId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 'evidence' || tab === 'messages') {
      const interval = setInterval(async () => {
        try {
          const res = await getDispute(disputeId);
          setData(res.data);
        } catch (_) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [tab, disputeId]);

  async function handleAssign() {
    try { await assignDispute(disputeId); await load(); } catch (err) { setError(err.message); }
  }

  async function handleAdjudicate() {
    if (!resolution || !resolutionMsg.trim()) { setError('Resolution type and message are required.'); return; }
    setAdjudicating(true);
    setError('');
    try {
      await adjudicateDispute(disputeId, resolution, resolutionMsg);
      setShowAdjudicate(false);
      setResolution('');
      setResolutionMsg('');
      await load();
    } catch (err) { setError(err.message); }
    setAdjudicating(false);
  }

  async function handleClose() {
    try { await closeDispute(disputeId); await load(); } catch (err) { setError(err.message); }
  }

  async function handleSendMsg() {
    if (!msgText.trim()) return;
    setSendingMsg(true);
    try {
      await sendDisputeMessage(disputeId, msgText.trim());
      setMsgText('');
      await load();
    } catch (err) { setError(err.message); }
    setSendingMsg(false);
  }

  if (loading && !data) return <div style={{ ...S.content, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>;
  if (!data) return <div style={S.content}><div style={S.errorBox}>{error || 'Not found.'}</div></div>;

  const evidence = data.evidence || [];
  const messages = data.messages || [];
  const milestones = data.milestones || [];
  const materials = data.materials || [];
  const matCost = materials.reduce((s, m) => s + Number(m.quantity) * Number(m.cost_per_unit), 0);
  const tabs = ['evidence', 'messages', 'commission'];
  if (data.status === 'resolved') tabs.push('resolution');

  return (
    <div style={S.content}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={onBack} style={{ ...S.btn, ...S.btnSecondary, marginBottom: 12 }}>← Back to Disputes</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e8e3f0' }}>{data.commission_title}</h1>
            <div style={{ fontSize: 13, color: '#705e8a', marginTop: 4 }}>
              Dispute {data.id.slice(0, 8)}… · {data.maker_name} vs {data.commissioner_name} · Raised {formatDate(data.created_at)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...S.badge, ...getBadgeStyle(data.status) }}>{data.status.replace('_', ' ')}</span>
            {data.resolution && <span style={{ ...S.badge, ...S.badgeResolved }}>{data.resolution.replace(/_/g, ' ')}</span>}
          </div>
        </div>
      </div>

      {error && <div style={{ ...S.errorBox, marginBottom: 16 }}>{error}</div>}

      {data.status === 'open' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={handleAssign} style={{ ...S.btn, ...S.btnPrimary }}>🔍 Assign to Me (Under Review)</button>
        </div>
      )}
      {data.status === 'under_review' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setShowAdjudicate(!showAdjudicate)} style={{ ...S.btn, ...S.btnSuccess }}>⚖️ Adjudicate</button>
        </div>
      )}
      {data.status === 'resolved' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={handleClose} style={{ ...S.btn, ...S.btnSecondary }}>📁 Close Dispute</button>
        </div>
      )}

      {showAdjudicate && (
        <div style={{ ...S.card, marginBottom: 16, border: '1px solid rgba(90,158,90,0.3)' }}>
          <div style={S.sectionTitle}>Adjudicate Dispute</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#705e8a', marginBottom: 5 }}>Resolution *</label>
            <select style={S.select} value={resolution} onChange={e => setResolution(e.target.value)}>
              <option value="">Select resolution…</option>
              <option value="maker_wins">Maker Favoured</option>
              <option value="commissioner_wins">Commissioner Favoured</option>
              <option value="split">Split Decision</option>
              <option value="cancelled">Commission Cancelled</option>
              <option value="no_resolution">No Resolution</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#705e8a', marginBottom: 5 }}>Resolution Message *</label>
            <textarea style={S.textarea} value={resolutionMsg} onChange={e => setResolutionMsg(e.target.value)} placeholder="Explain your decision and reasoning…" />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdjudicate} disabled={adjudicating || !resolution || !resolutionMsg.trim()} style={{ ...S.btn, ...S.btnSuccess }}>
              {adjudicating ? 'Submitting…' : 'Submit Resolution'}
            </button>
            <button onClick={() => setShowAdjudicate(false)} style={{ ...S.btn, ...S.btnSecondary }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', borderBottom: '1px solid #2a2540', marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 16px', background: 'none', border: 'none',
            color: tab === t ? '#9c6fd6' : '#705e8a', fontSize: 13,
            fontWeight: tab === t ? 600 : 500, cursor: 'pointer',
            borderBottom: tab === t ? '2px solid #9c6fd6' : '2px solid transparent', marginBottom: -1,
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'evidence' && (
        <div>
          {evidence.length === 0 ? (
            <div style={S.empty}>No evidence submitted yet.</div>
          ) : evidence.map(ev => (
            <div key={ev.id} style={{ ...S.card, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#e8e3f0' }}>{ev.username}</span>
                <span style={{ ...S.badge, ...S.badgeClosed }}>{ev.role}</span>
                <span style={{ fontSize: 11, color: '#705e8a', marginLeft: 'auto' }}>{formatDate(ev.created_at)}</span>
              </div>
              {ev.message && <p style={{ fontSize: 13, color: '#b09ac0', lineHeight: 1.6, marginBottom: 8 }}>{ev.message}</p>}
              {ev.media?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ev.media.map((m, mi) => (
                    m.media_type === 'image' ? (
                      <a key={mi} href={m.file_url} target="_blank" rel="noopener noreferrer">
                        <img src={m.file_url} alt={m.original_name} style={{ width: 80, height: 80, borderRadius: 6, objectFit: 'cover', border: '1px solid #2a2540' }} />
                      </a>
                    ) : (
                      <a key={mi} href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ ...S.btn, ...S.btnSecondary, ...S.btnSm }}>
                        📄 {m.original_name || 'Document'}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'messages' && (
        <div>
          <div style={{ ...S.card, marginBottom: 12, maxHeight: 400, overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <div style={{ ...S.empty, padding: 20 }}>No messages yet.</div>
            ) : messages.map(m => {
              const isMediator = m.role === 'admin';
              const isOwn = m.sender_id === localStorage.getItem('ruffl_admin_user_id');
              return (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: '#705e8a' }}>{m.username}</span>
                    {isMediator && <span style={{ ...S.badge, background: 'rgba(13,115,119,0.2)', color: '#0d7377', fontSize: 9 }}>Mediator</span>}
                  </div>
                  <div style={{ ...S.msgBubble, ...(isOwn ? S.msgOwn : isMediator ? S.msgMediator : S.msgOther) }}>{m.content}</div>
                  <span style={{ fontSize: 10, color: '#705e8a', marginTop: 2 }}>{formatDate(m.sent_at)}</span>
                </div>
              );
            })}
          </div>
          {data.status !== 'closed' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...S.input, flex: 1 }} value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="Type a message to both parties…" onKeyDown={e => e.key === 'Enter' && handleSendMsg()} />
              <button onClick={handleSendMsg} disabled={sendingMsg || !msgText.trim()} style={{ ...S.btn, ...S.btnPrimary }}>Send</button>
            </div>
          )}
        </div>
      )}

      {tab === 'commission' && (
        <div>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={S.sectionTitle}>Parties</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><div style={{ fontSize: 12, color: '#705e8a', marginBottom: 4 }}>Maker</div><div style={{ fontWeight: 600, color: '#e8e3f0' }}>{data.maker_name}</div></div>
              <div><div style={{ fontSize: 12, color: '#705e8a', marginBottom: 4 }}>Commissioner</div><div style={{ fontWeight: 600, color: '#e8e3f0' }}>{data.commissioner_name}</div></div>
            </div>
          </div>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={S.sectionTitle}>Financial Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Total Commission Value', `£${Number(data.total_amount || 0).toFixed(2)}`],
                ['Deposit Amount', `£${Number(data.deposit_amount || 0).toFixed(2)}`],
                ['Deposit Paid', data.deposit_paid ? 'Yes' : 'No'],
                ['Material Costs', `£${matCost.toFixed(2)}`],
                ['Estimated Profit', `£${(Number(data.total_amount || 0) - matCost).toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '4 0' }}>
                  <span style={{ fontSize: 13, color: '#705e8a' }}>{label}</span>
                  <span style={{ fontSize: 13, color: '#e8e3f0', fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={S.sectionTitle}>Milestone Progress</div>
            {milestones.map(ms => (
              <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #2a2540' }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: ms.status === 'complete' ? '#5a9e5a' : ms.status === 'active' ? '#9c6fd6' : '#3a3550' }} />
                <span style={{ flex: 1, fontSize: 13, color: '#b09ac0' }}>{ms.name}</span>
                <span style={{ fontSize: 11, color: '#705e8a' }}>{ms.status}</span>
                <span style={{ fontSize: 12, color: '#b09ac0' }}>£{Number(ms.payment_amount || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {materials.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Materials Log</div>
              <table style={S.table}>
                <thead><tr><th style={S.th}>Item</th><th style={S.th}>Qty</th><th style={S.th}>Cost</th></tr></thead>
                <tbody>
                  {materials.map(m => (
                    <tr key={m.id}>
                      <td style={S.td}>{m.item_name}</td>
                      <td style={S.td}>{m.quantity} {m.unit}</td>
                      <td style={S.td}>£{(Number(m.quantity) * Number(m.cost_per_unit)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'resolution' && data.status === 'resolved' && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Resolution</div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#705e8a' }}>Decision: </span>
            <span style={{ fontWeight: 600, color: '#5a9e5a' }}>{data.resolution?.replace(/_/g, ' ') || '—'}</span>
          </div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: '#705e8a' }}>Resolved: </span>
            <span style={{ fontSize: 13, color: '#e8e3f0' }}>{formatDate(data.resolved_at)}</span>
          </div>
          {data.resolution_message && (
            <>
              <hr style={S.divider} />
              <div style={{ fontSize: 13, color: '#705e8a', marginBottom: 6 }}>Mediator's Message</div>
              <p style={{ fontSize: 13, color: '#b09ac0', lineHeight: 1.7 }}>{data.resolution_message}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('disputes');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    if (isLoggedIn()) {
      const token = localStorage.getItem('ruffl_admin_token');
      if (token) setUser({ token });
    }
  }, []);

  function handleLogin(data) {
    localStorage.setItem('ruffl_admin_user_id', data.user.id);
    setUser(data.user);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setSelectedDispute(null);
    setSelectedUser(null);
    setSelectedChat(null);
    setPage('disputes');
  }

  function handleNav(p) {
    setPage(p);
    setSelectedDispute(null);
    setSelectedUser(null);
    setSelectedChat(null);
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Determine what to render
  let content;
  let topBarTitle;

  if (selectedChat) {
    content = <AdminChatRoomPage roomId={selectedChat} onBack={() => setSelectedChat(null)} />;
    topBarTitle = 'Admin Chat';
  } else if (selectedUser) {
    content = <UserDetailPage userId={selectedUser} onBack={() => setSelectedUser(null)} onMessageUser={(chatId) => { setSelectedUser(null); setSelectedChat(chatId); }} />;
    topBarTitle = 'User Detail';
  } else if (selectedDispute) {
    content = <DisputeDetailPage disputeId={selectedDispute} onBack={() => setSelectedDispute(null)} />;
    topBarTitle = 'Dispute Detail';
  } else if (page === 'users') {
    content = <UsersPage onViewUser={setSelectedUser} />;
    topBarTitle = 'User Management';
  } else if (page === 'chats') {
    content = <AdminChatsPage onViewChat={setSelectedChat} />;
    topBarTitle = 'Admin Chats';
  } else {
    content = <DisputeListPage onViewDispute={setSelectedDispute} />;
    topBarTitle = 'Dispute Resolution';
  }

  return (
    <div style={S.page}>
      <nav style={S.sidebar}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2a2540' }}>
          <div style={S.logo}>🐾 Ruffl</div>
          <div style={S.logoSub}>Admin Dashboard</div>
        </div>
        <div style={S.nav}>
          <div style={{ ...S.navItem, ...(page === 'disputes' && !selectedDispute ? S.navItemActive : {}) }}
               onClick={() => handleNav('disputes')}>⚖️ Disputes</div>
          <div style={{ ...S.navItem, ...(page === 'users' && !selectedUser ? S.navItemActive : {}) }}
               onClick={() => handleNav('users')}>👥 Users</div>
          <div style={{ ...S.navItem, ...(page === 'chats' && !selectedChat ? S.navItemActive : {}) }}
               onClick={() => handleNav('chats')}>💬 Admin Chats</div>
        </div>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2a2540' }}>
          <div style={{ fontSize: 12, color: '#705e8a', marginBottom: 8 }}>{user?.email || 'Admin'}</div>
          <button onClick={handleLogout} style={{ ...S.btn, ...S.btnSecondary, width: '100%', justifyContent: 'center' }}>Sign Out</button>
        </div>
      </nav>

      <div style={S.main}>
        <div style={S.topBar}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e8e3f0' }}>{topBarTitle}</div>
          <div style={{ fontSize: 12, color: '#705e8a' }}>Ruffl Administration</div>
        </div>
        {content}
      </div>
    </div>
  );
}
