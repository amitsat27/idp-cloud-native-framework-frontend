import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Clear any existing context errors on mount
  useEffect(() => {
    setError(null);
  }, []);

  const roleDescriptions: Record<string, string> = {
    VIEWER: 'Can only view cluster status',
    OPERATOR: 'Can view status, plans, and deploy',
    ADMIN: 'Full access including user management',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!username || !email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    try {
      setIsLoading(true);
      await signup(username, email, password, role);
      setSignupSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setLocalError(err.response?.data?.detail || err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <Alert severity="success" sx={{ textAlign: 'center' }}>
            <Typography variant="h6">Signup request submitted!</Typography>
            <Typography variant="body2">
              Your account is pending admin approval. You will be redirected to login shortly.
            </Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            width: '100%',
            p: 3,
            boxShadow: 1,
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" component="h1" sx={{ mb: 3, textAlign: 'center' }}>
            Sign Up
          </Typography>

          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || localError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              type="text"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              inputProps={{ minLength: 3 }}
            />

            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              inputProps={{ minLength: 8 }}
              helperText="Minimum 8 characters"
            />

            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />

            <FormControl fullWidth>
              <InputLabel>Requested Role</InputLabel>
              <Select
                value={role}
                label="Requested Role"
                onChange={(e) => setRole(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="VIEWER">
                  <Box>
                    <Typography variant="body1">VIEWER</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {roleDescriptions.VIEWER}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="OPERATOR">
                  <Box>
                    <Typography variant="body1">OPERATOR</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {roleDescriptions.OPERATOR}
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="ADMIN">
                  <Box>
                    <Typography variant="body1">ADMIN</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {roleDescriptions.ADMIN}
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                Requested role: <strong>{role}</strong> - {roleDescriptions[role]}
              </Typography>
            </Alert>

            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={isLoading}
              sx={{ mt: 2 }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
            Already have an account?{' '}
            <Button
              color="primary"
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none' }}
            >
              Login here
            </Button>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Signup;
