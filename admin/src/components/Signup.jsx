import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
  Container,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import logo from '../assets/speakforgelogo_light.png';
import app from '../firebase';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  // Brand Colors matching Login
  const colors = {
    primary: '#387ADF',
    secondary: '#50C4ED',
    accent: '#FBA834',
    dark: '#333333',
    light: '#F9FAFB',
    white: '#FFFFFF'
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Basic Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth(app);
      const db = getDatabase(app);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const timestamp = new Date().toISOString(); // Matches "yyyy-MM-dd'T'HH:mm:ss'Z'" loosely, sufficient for JS ISO

      // Structure matches User.java model from Android app
      const userData = {
        userId: user.uid,
        username: email, // Default username as email, similar to mobile app
        email: email,
        profileImageUrl: "none",
        accountType: "free",
        language: null, // Initial null/default
        createdAt: timestamp,
        lastLoginDate: timestamp,
        translator: "google",
        isAdmin: false // Default to false
      };

      // Save to Realtime Database
      await set(ref(db, 'users/' + user.uid), userData);

      // Redirect to login or directly login
      navigate('/login'); 
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Email address is already in use');
      } else {
        setError('Failed to create account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Shapes */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: -50,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
        zIndex: 0
      }} />

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper 
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${colors.primary}15`,
              borderRadius: '50%',
              color: colors.primary
            }}>
              <Box component="img" src={logo} alt="SpeakForge Logo" sx={{ width: 50, height: 50 }} />
            </Box>
            
            <Typography variant="h5" component="h1" sx={{ fontWeight: 800, color: colors.dark, mb: 1 }}>
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 4 }}>
              Join SpeakForge today
            </Typography>

            <Box component="form" onSubmit={handleSignup} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: colors.primary }} />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: colors.primary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: colors.primary }} />
                    </InputAdornment>
                  )
                }}
              />
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  bgcolor: colors.primary,
                  color: colors.white,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: `0 8px 16px ${colors.primary}40`,
                  '&:hover': {
                    bgcolor: '#2c62b5',
                    boxShadow: `0 12px 20px ${colors.primary}60`,
                  },
                  mt: 1
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
              </Button>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?
                </Typography>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" sx={{ color: colors.primary, fontWeight: 600 }}>
                    Log In
                  </Typography>
                </Link>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Signup;

