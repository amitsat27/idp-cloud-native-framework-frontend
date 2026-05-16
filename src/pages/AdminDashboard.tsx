import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface User {
  user_id: string;
  username: string;
  email: string;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE';
  role: 'VIEWER' | 'OPERATOR' | 'ADMIN';
  created_at: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [newRole, setNewRole] = useState<'VIEWER' | 'OPERATOR' | 'ADMIN'>('VIEWER');
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'deactivate' | 'change-role' | null;
    user: User | null;
  }>({ open: false, action: null, user: null });

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get pending requests
      const pendingRes = await api.get('/admin/requests');
      setPendingRequests(pendingRes.data.requests || []);

      // Get active users
      const usersRes = await api.get('/admin/users');
      setActiveUsers(usersRes.data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setError(null);
      await api.patch(`/admin/users/${userId}/approve`);
      setSuccess('User approved');
      setActionDialog({ open: false, action: null, user: null });
      setTimeout(loadData, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to approve user');
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectReason) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setError(null);
      await api.patch(`/admin/users/${userId}/reject`, {
        reason: rejectReason,
      });
      setSuccess('User rejected');
      setActionDialog({ open: false, action: null, user: null });
      setRejectReason('');
      setTimeout(loadData, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reject user');
    }
  };

  const handleDeactivate = async (userId: string) => {
    try {
      setError(null);
      await api.patch(`/admin/users/${userId}/deactivate`, {
        reason: 'Admin deactivation',
      });
      setSuccess('User deactivated');
      setActionDialog({ open: false, action: null, user: null });
      setTimeout(loadData, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deactivate user');
    }
  };

  const handleChangeRole = async (userId: string) => {
    try {
      setError(null);
      await api.patch(`/admin/users/${userId}/role`, {
        role: newRole,
      });
      setSuccess(`User role updated to ${newRole}`);
      setActionDialog({ open: false, action: null, user: null });
      setNewRole('VIEWER');
      setTimeout(loadData, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to change user role');
    }
  };

  if (isLoading && pendingRequests.length === 0) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4">Admin Dashboard</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={`Pending Requests (${pendingRequests.length})`} />
          <Tab label={`Active Users (${activeUsers.length})`} />
        </Tabs>
      </Box>

      {/* Pending Requests Tab */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Requested Role</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No pending requests
                  </TableCell>
                </TableRow>
              ) : (
                pendingRequests.map((req) => (
                  <TableRow key={req.user_id}>
                    <TableCell>{req.username}</TableCell>
                    <TableCell>{req.email}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: req.role === 'ADMIN' ? 'error' : 'primary' }}>
                        {req.role}
                      </Typography>
                    </TableCell>
                    <TableCell>{new Date(req.created_at * 1000).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => setActionDialog({ open: true, action: 'approve', user: req })}
                        sx={{ mr: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setActionDialog({ open: true, action: 'reject', user: req })}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Active Users Tab */}
      {tabValue === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    No active users
                  </TableCell>
                </TableRow>
              ) : (
                activeUsers.map((usr) => (
                  <TableRow key={usr.user_id}>
                    <TableCell>{usr.username}</TableCell>
                    <TableCell>{usr.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={usr.role}
                        color={usr.role === 'ADMIN' ? 'error' : usr.role === 'OPERATOR' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(usr.created_at * 1000).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1 }}
                        onClick={() => {
                          setNewRole(usr.role);
                          setActionDialog({ open: true, action: 'change-role', user: usr });
                        }}
                      >
                        Change Role
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setActionDialog({ open: true, action: 'deactivate', user: usr })}
                      >
                        Deactivate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, action: null, user: null })}>
        <DialogTitle>
          {actionDialog.action === 'approve' && 'Approve User'}
          {actionDialog.action === 'reject' && 'Reject User'}
          {actionDialog.action === 'deactivate' && 'Deactivate User'}
          {actionDialog.action === 'change-role' && 'Change User Role'}
        </DialogTitle>
        <DialogContent>
          {actionDialog.action === 'reject' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Please provide a reason for rejection:
              </Typography>
              <Box
                component="textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                sx={{
                  width: '100%',
                  p: 1,
                  borderRadius: 1,
                  border: '1px solid #ddd',
                  fontFamily: 'inherit',
                }}
              />
            </Box>
          )}

          {actionDialog.action === 'change-role' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                User: <strong>{actionDialog.user?.username}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Current Role: <strong>{actionDialog.user?.role}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                New Role:
              </Typography>
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                fullWidth
              >
                <MenuItem value="VIEWER">VIEWER (View only)</MenuItem>
                <MenuItem value="OPERATOR">OPERATOR (Deploy & Manage)</MenuItem>
                <MenuItem value="ADMIN">ADMIN (Full Access)</MenuItem>
              </Select>
              <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  <strong>Role Permissions:</strong>
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
                  • VIEWER: View plans and cluster status only
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
                  • OPERATOR: Deploy, manage resources, scale
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
                  • ADMIN: Manage users, approve signups, all operations
                </Typography>
              </Box>
            </Box>
          )}

          {actionDialog.action !== 'reject' && actionDialog.action !== 'change-role' && (
            <Typography>
              Are you sure you want to{' '}
              {actionDialog.action === 'approve' && 'approve'}
              {actionDialog.action === 'deactivate' && 'deactivate'} user{' '}
              <strong>{actionDialog.user?.username}</strong>?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog({ open: false, action: null, user: null })}>Cancel</Button>
          <Button
            variant="contained"
            color={actionDialog.action === 'deactivate' ? 'error' : 'success'}
            onClick={() => {
              if (actionDialog.action === 'approve' && actionDialog.user) {
                handleApprove(actionDialog.user.user_id);
              } else if (actionDialog.action === 'reject' && actionDialog.user) {
                handleReject(actionDialog.user.user_id);
              } else if (actionDialog.action === 'deactivate' && actionDialog.user) {
                handleDeactivate(actionDialog.user.user_id);
              } else if (actionDialog.action === 'change-role' && actionDialog.user) {
                handleChangeRole(actionDialog.user.user_id);
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
