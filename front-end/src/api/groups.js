import { groupsApi } from './client';

// fetching all the groups related apis for the frontend usecase

export const fetchGroups = () => groupsApi.get('/groups/');
export const createGroup = (data) => groupsApi.post('/groups/', data);
export const updateGroup = (id, data) => groupsApi.put(`/groups/${id}`, data);
export const deleteGroup = (id) => groupsApi.delete(`/groups/${id}`);
export const fetchGroupMembers = (id) => groupsApi.get(`/groups/${id}/members`);
export const addGroupMembers = (id, device_ids) => groupsApi.post(`/groups/${id}/members`, device_ids);
export const deleteGroupMember = (groupId, memberId) => groupsApi.delete(`/groups/${groupId}/members/${memberId}`);
