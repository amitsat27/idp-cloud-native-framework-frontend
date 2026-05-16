import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Chip,
} from '@mui/material';
import {
  Cloud,
  Rocket,
  DynamicFeed,
  Storage,
  Dns,
  Speed,
  DynamicForm,
  Hub,
  Inventory,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      const role = user?.role;
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'OPERATOR') navigate('/dashboard');
      else navigate('/status');
    } else {
      navigate('/login');
    }
  };

  const capabilities = [
    {
      icon: <DynamicFeed sx={{ fontSize: 40, color: '#667eea' }} />,
      title: 'Intent-Driven',
      description: 'Describe what you need in plain language, let IDP handle the rest',
    },
    {
      icon: <Inventory sx={{ fontSize: 40, color: '#764ba2' }} />,
      title: 'Container Management',
      description: 'Deploy and manage containerized applications on Kubernetes',
    },
    {
      icon: <Hub sx={{ fontSize: 40, color: '#FF9800' }} />,
      title: 'Orchestration',
      description: 'Automatic scaling, healing, and load balancing',
    },
    {
      icon: <Speed sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Instant Provisioning',
      description: 'Get your infrastructure ready in seconds, not hours',
    },
  ];

  const steps = [
    { step: '1', title: 'Describe', desc: 'Write your infrastructure needs in plain English' },
    { step: '2', title: 'AI Parses', desc: 'IDP understands your intent and creates a plan' },
    { step: '3', title: 'Provision', desc: 'Resources are automatically deployed to Kubernetes' },
    { step: '4', title: 'Manage', desc: 'Monitor and scale your containers from the dashboard' },
  ];

  return (
    <Box sx={{ overflow: 'auto', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ background: 'transparent', boxShadow: 'none' }}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Cloud sx={{ color: '#667eea' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
              IDP
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          {isAuthenticated ? (
            <Button color="inherit" onClick={handleGetStarted} sx={{ color: '#333' }}>
              {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'OPERATOR' ? 'Dashboard' : 'Status'}
            </Button>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')} sx={{ color: '#333', mr: 1 }}>
                Login
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/signup')}
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              >
                Get Started
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 12, textAlign: 'center' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" sx={{ fontWeight: 'bold', mb: 2, color: '#1a1a2e' }}>
            Intent-Driven Container Provisioning
          </Typography>
          <Typography variant="h5" sx={{ mb: 3, color: '#4a4a6a', fontWeight: 300 }}>
            Describe your infrastructure needs in plain language
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: 700, mx: 'auto', mb: 5, color: '#666', fontSize: '1.1rem' }}>
            Simply tell IDP what you need - "deploy nginx with 3 replicas" or 
            "set up PostgreSQL with auto-scaling" - and watch it materialize 
            on your Kubernetes cluster.
          </Typography>
          <Button variant="contained" size="large" onClick={handleGetStarted} startIcon={<Rocket />}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', px: 4, py: 1.5, fontSize: '1.1rem' }}>
            Start Deploying
          </Button>
          <Box sx={{ mt: 4 }}>
            <Card sx={{ maxWidth: 600, mx: 'auto', textAlign: 'left', borderLeft: '4px solid #667eea' }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">Try typing something like:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', color: '#333', mt: 1 }}>
                  "deploy nginx with 3 replicas"
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 10, backgroundColor: '#fff' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold', color: '#1a1a2e' }}>
            What You Can Do
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', mb: 6, color: '#666' }}>
            Describe your intent, let IDP handle the complexity
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
            {capabilities.map((item, idx) => (
              <Card key={idx} sx={{ width: '23%', minWidth: 200, textAlign: 'center', boxShadow: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 2 }}>{item.icon}</Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1a1a2e' }}>{item.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>{item.description}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 10, background: '#f8f9fa' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ textAlign: 'center', mb: 6, fontWeight: 'bold', color: '#1a1a2e' }}>
            How It Works
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {steps.map((item, idx) => (
              <Box key={idx} sx={{ width: '45%', minWidth: 200, textAlign: 'center' }}>
                <Box sx={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {item.step}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{item.title}</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>{item.desc}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Box sx={{ py: 10, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Container maxWidth="sm">
          <Typography variant="h4" sx={{ mb: 2, fontWeight: 'bold' }}>Ready to Get Started?</Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>Join thousands of developers deploying with IDP</Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/signup')} sx={{ background: 'white', color: '#667eea', px: 4, fontWeight: 'bold' }}>
            Create Free Account
          </Button>
        </Container>
      </Box>

      <Box sx={{ background: '#1a1a2e', py: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>&copy; 2026 IDP - Intent-Driven Container Provisioning Platform</Typography>
      </Box>
    </Box>
  );
};

export default Landing;