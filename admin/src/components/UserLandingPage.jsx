import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { getDatabase, ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import app from '../firebase';
import AndroidIcon from '@mui/icons-material/Android';
import DownloadIcon from '@mui/icons-material/Download';
import logo from '../assets/speakforgelogo_light.png';

const UserLandingPage = () => {
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadApkDownloadUrl = async () => {
      try {
        const db = getDatabase(app);
        const settingsRef = ref(db, 'settings');
        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          setApkDownloadUrl(snapshot.val().apkDownloadUrl);
        }
      } catch (error) {
        console.error('Error loading APK URL', error);
      }
    };
    loadApkDownloadUrl();
  }, []);

  const colors = {
    primary: '#387ADF',
    secondary: '#50C4ED',
    dark: '#333',
    white: '#FFF'
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3
    }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 5, borderRadius: 4, textAlign: 'center', bgcolor: colors.white }}>
          <Box component="img" src={logo} alt="SpeakForge" sx={{ height: 60, mb: 3 }} />
          
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.primary, mb: 2 }}>
            Welcome to SpeakForge
          </Typography>
          
          <Typography variant="body1" sx={{ color: '#64748b', mb: 4, lineHeight: 1.6 }}>
            The web portal is currently reserved for administrative use. 
            To experience the full power of our real-time translation features, 
            please download our Android application.
          </Typography>

          <Box sx={{ 
            p: 4, 
            bgcolor: '#f1f5f9', 
            borderRadius: 3, 
            border: '1px dashed #cbd5e1',
            mb: 4 
          }}>
            <AndroidIcon sx={{ fontSize: 50, color: '#3ddc84', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Get the Mobile App
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Optimized for seamless performance on your device.
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadIcon />}
              href={apkDownloadUrl || '#'}
              target="_blank"
              disabled={!apkDownloadUrl}
              sx={{
                bgcolor: colors.primary,
                borderRadius: 50,
                px: 4,
                textTransform: 'none',
                fontWeight: 700
              }}
            >
              Download APK
            </Button>
          </Box>

          <Button 
            variant="text" 
            onClick={() => navigate('/login')}
            sx={{ color: '#94a3b8', textTransform: 'none' }}
          >
            Back to Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default UserLandingPage;

