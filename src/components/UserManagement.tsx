import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Typography,
} from "@mui/material";
import api from "../api/axios";

interface User {
  user_id: string;
  username: string;
  email: string;
  role: "VIEWER" | "OPERATOR" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "REJECTED";
  created_at: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<"VIEWER" | "OPERATOR" | "ADMIN">("VIEWER");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.users || []);
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.detail || "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    try {
      await api.patch(`/admin/users/${selectedUser.user_id}/role`, {
        role: newRole,
      });

      setMessage({
        type: "success",
        text: `${selectedUser.username}'s role updated to ${newRole}`,
      });

      // Update local state
      setUsers(
        users.map((u) =>
          u.user_id === selectedUser.user_id ? { ...u, role: newRole } : u
        )
      );

      handleCloseDialog();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.detail || "Failed to update role",
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "error";
      case "OPERATOR":
        return "warning";
      case "VIEWER":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "PENDING":
        return "info";
      case "REJECTED":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        User Management
      </Typography>

      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Current Role</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id} hover>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status) as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleOpenDialog(user)}
                      disabled={user.status !== "ACTIVE"}
                    >
                      Change Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Role Update Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Update User Role</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUser && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body2">
                <strong>Username:</strong> {selectedUser.username}
              </Typography>
              <Typography variant="body2">
                <strong>Current Role:</strong> {selectedUser.role}
              </Typography>
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>New Role:</strong>
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
              </Box>

              {/* Role Descriptions */}
              <Box
                sx={{
                  p: 2,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 1,
                  mt: 2,
                }}
              >
                <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
                  <strong>Role Permissions:</strong>
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  • <strong>VIEWER:</strong> View plans and cluster status only
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  • <strong>OPERATOR:</strong> Deploy, manage resources, scale
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  • <strong>ADMIN:</strong> Manage users, approve signups, all operations
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            color="primary"
            disabled={selectedUser?.role === newRole}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
