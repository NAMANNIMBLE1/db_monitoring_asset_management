import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchGroups, deleteGroup, createGroup } from '../api/groups';
import GroupModal from '../components/groups/GroupModal';

const GroupsPage = () => {
  const location = useLocation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('manage');
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await fetchGroups();
      setGroups(res.data);
    } catch {
      alert('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get('create') === '1') {
      setActiveTab('create');
    }
  }, [location.search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this group?')) return;
    await deleteGroup(id);
    loadGroups();
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    const deviceIds = membersInput
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await createGroup({ name: groupName, device_ids: deviceIds });
      setGroupName('');
      setMembersInput('');
      setActiveTab('manage');
      await loadGroups();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail?.unresolved?.length) {
        alert(`Unknown devices: ${detail.unresolved.join(', ')}`);
      } else {
        alert('Failed to create group');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => (g.name || '').toLowerCase().includes(q));
  }, [groups, search]);

  return (
    <div className="groups-page">
      <div className="page-header">
        <h2>Device Groups</h2>
      </div>

      <div className="groups-tabs">
        <button className={`btn ${activeTab === 'create' ? 'btn--primary' : ''}`} onClick={() => setActiveTab('create')}>
          Create New Group
        </button>
        <button className={`btn ${activeTab === 'manage' ? 'btn--primary' : ''}`} onClick={() => setActiveTab('manage')}>
          Manage Groups
        </button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleCreateGroup} className="groups-create-card">
          <label className="groups-label">Group Name</label>
          <input
            className="input"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g. primary-site"
            required
          />

          <label className="groups-label">Hostnames / IPs / Device IDs (comma separated)</label>
          <input
            className="input"
            value={membersInput}
            onChange={(e) => setMembersInput(e.target.value)}
            placeholder="10.10.10.251, dr-dcim"
          />

          <div className="groups-create-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Group'}
            </button>
          </div>
        </form>
      ) : (
        <div className="groups-manage-card">
          <input
            className="input"
            id="groups-search"
            placeholder="Search group by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Members</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Loading...</td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan="5">No groups found.</td>
                  </tr>
                ) : (
                  filteredGroups.map((g) => (
                    <tr key={g.id}>
                      <td>{g.name}</td>
                      <td>{g.member_count ?? 0} devices</td>
                      <td>{new Date(g.created_at).toLocaleString()}</td>
                      <td>{new Date(g.updated_at).toLocaleString()}</td>
                      <td className="groups-actions-cell">
                        <button className="btn btn--small" onClick={() => { setEditGroup(g); setModalOpen(true); }}>Edit</button>
                        <button className="btn btn--small" onClick={() => handleDelete(g.id)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GroupModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={loadGroups} editGroup={editGroup} />
    </div>
  );
};

export default GroupsPage;
