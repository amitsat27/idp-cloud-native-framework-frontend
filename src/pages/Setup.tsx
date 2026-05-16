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
} from '@mui/material';
import api from '../api/axios';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      try {
        const response = await api.get('/api/v1/setup');
        setSetupNeeded(response.data.setup_needed);
      } catch (err) {
        setError('Failed to check setup status');
      } finally {
        setIsLoading(false);
      }
    };

    checkSetup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsCreating(true);
      const response = await api.post('/api/v1/setup/create-admin', {
        username,
        email,
        password,
        password_confirm: password,
      });

      if (response.data) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create admin');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!setupNeeded) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Alert severity="info">
            <Typography>Setup already completed. Redirecting to login...</Typography>
          </Alert>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Alert severity="success">
            <Typography variant="h6">Admin created successfully!</Typography>
            <Typography variant="body2">Redirecting to dashboard...</Typography>
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
          <Typography variant="h4" component="h1" sx={{ mb: 1, textAlign: 'center' }}>
            Initial Setup
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
            Create the first admin account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Admin Username"
              type="text"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isCreating}
            />

            <TextField
              label="Admin Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isCreating}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isCreating}
            />

            <TextField
              label="Confirm Password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isCreating}
            />

            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={isCreating}
              sx={{ mt: 2 }}
            >
              {isCreating ? <CircularProgress size={24} /> : 'Create Admin Account'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Setup;
