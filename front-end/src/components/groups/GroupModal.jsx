import React, { useState, useEffect } from 'react';
import { createGroup, updateGroup, fetchGroupMembers } from '../../api/groups';

const GroupModal = ({ open, onClose, onSuccess, editGroup }) => {
  const [name, setName] = useState(editGroup ? editGroup.name : '');
  const [deviceIds, setDeviceIds] = useState([]); // static group members (id/ip/hostname tokens)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadExistingMembers = async () => {
      if (!editGroup?.id || !open) return;
      try {
        const res = await fetchGroupMembers(editGroup.id);
        const existing = (res?.data || []).map((m) => String(m.device_id));
        setDeviceIds(existing);
      } catch {
        setDeviceIds([]);
      }
    };

    if (editGroup) {
      setName(editGroup.name);
      setDeviceIds([]);
      loadExistingMembers();
    } else {
      setName('');
      setDeviceIds([]);
    }
  }, [editGroup, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, device_ids: deviceIds };
      if (editGroup) await updateGroup(editGroup.id, payload);
      else await createGroup(payload);
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (detail?.unresolved?.length) {
        alert(`Unknown devices: ${detail.unresolved.join(', ')}`);
      } else {
        alert('Error saving group');
      }
    } finally {
      setLoading(false);
    }
  };

  return open ? (
    <div className="modal-backdrop">
      <div className="groups-modal">
        <h2 className="groups-modal__title">{editGroup ? 'Edit Group' : 'Create Group'}</h2>
        <form onSubmit={handleSubmit} className="groups-modal__form">
          <label className="groups-label">Group Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} required />
          <div className="groups-modal__field">
            <label className="groups-label">Static Group (comma separated IDs, IPs, or hostnames)</label>
            <input
              className="input"
              value={deviceIds.join(',')}
              onChange={e => setDeviceIds(e.target.value.split(',').map(v=>v.trim()).filter(Boolean))}
            />
          </div>
          <div className="groups-modal__actions">
            <button className="btn btn--primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button className="btn" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default GroupModal;
