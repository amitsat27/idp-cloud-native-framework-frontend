import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Cloud } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const sessionMessage = searchParams.get('expired')
    ? 'Your session has expired. Please log in again.'
    : searchParams.get('deactivated')
    ? 'Your account has been deactivated. Contact an administrator.'
    : null;

  useEffect(() => {
    setError(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setError(null);

    if (!username || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
      }}
    >
      {/* Left Side - Login Form */}
      <Container maxWidth="sm" sx={{ flex: 1, width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          sx={{
            width: '100%',
            p: 5,
            boxShadow: 3,
            borderRadius: 3,
            background: 'white',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1a1a2e', mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ color: '#666' }}>
              Sign in to access your dashboard
            </Typography>
          </Box>

          {sessionMessage && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {sessionMessage}
            </Alert>
          )}
          {(error || localError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || localError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Username"
              type="text"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <Button
              variant="contained"
              fullWidth
              type="submit"
              disabled={isLoading}
              sx={{
                mt: 1,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 'bold',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd6 0%, #654a8f 100%)',
                },
                '&:disabled': {
                  background: '#ccc',
                }
              }}
            >
              {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="body2" sx={{ mt: 4, textAlign: 'center', color: '#666' }}>
            Don't have an account?{' '}
            <Button
              color="primary"
              onClick={() => navigate('/signup')}
              sx={{ textTransform: 'none', fontWeight: 'bold' }}
            >
              Sign up here
            </Button>
          </Typography>
        </Box>
      </Container>

      {/* Right Side - Branding */}
      <Box
        sx={{
          flex: 1,
          width: '50%',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 6,
        }}
      >
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Cloud sx={{ fontSize: 60, mr: 2 }} />
            <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
              IDP
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            Intent-Driven Container Provisioning
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
            Deploy and manage your Kubernetes infrastructure with simple intent-based commands
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;