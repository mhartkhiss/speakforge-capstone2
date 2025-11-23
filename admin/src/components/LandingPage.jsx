import React, { useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  AppBar, 
  Toolbar,
  useTheme,
  useMediaQuery,
  Avatar,
  Paper,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TranslateIcon from '@mui/icons-material/Translate';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LanguageIcon from '@mui/icons-material/Language';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AndroidIcon from '@mui/icons-material/Android';
import CodeIcon from '@mui/icons-material/Code';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import PsychologyIcon from '@mui/icons-material/Psychology';
import DownloadIcon from '@mui/icons-material/Download';

const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const downloadSectionRef = useRef(null);

  const handleGetStarted = () => {
    downloadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Brand Colors
  const colors = {
    primary: '#387ADF',
    secondary: '#50C4ED',
    accent: '#FBA834',
    dark: '#333333',
    light: '#F9FAFB',
    white: '#FFFFFF'
  };

  const features = [
    {
      title: 'Real-time Translation',
      description: 'Instantly translate chat messages into multiple languages with high accuracy.',
      icon: <TranslateIcon fontSize="large" sx={{ color: colors.primary }} />
    },
    {
      title: 'Voice-to-Text',
      description: 'Speak naturally in your native language and have it transcribed and translated instantly.',
      icon: <RecordVoiceOverIcon fontSize="large" sx={{ color: colors.accent }} />
    },
    {
      title: 'Text-to-Speech',
      description: 'Hear translated messages in a natural-sounding synthesized voice.',
      icon: <VolumeUpIcon fontSize="large" sx={{ color: colors.secondary }} />
    },
    {
      title: 'Multilingual Support',
      description: 'Specialized support for Bisaya and major international languages.',
      icon: <LanguageIcon fontSize="large" sx={{ color: colors.primary }} />
    },
    {
      title: 'Secure & Private',
      description: 'Enterprise-grade security ensuring your conversations remain private.',
      icon: <SecurityIcon fontSize="large" sx={{ color: colors.accent }} />
    },
    {
      title: 'Admin Dashboard',
      description: 'Powerful tools for user management, analytics, and system configuration.',
      icon: <DashboardIcon fontSize="large" sx={{ color: colors.secondary }} />
    }
  ];

  const techStack = [
    { name: 'Android', icon: <AndroidIcon /> },
    { name: 'React', icon: <CodeIcon /> },
    { name: 'Django', icon: <StorageIcon /> },
    { name: 'Firebase', icon: <CloudIcon /> },
    { name: 'Gemini AI', icon: <PsychologyIcon /> }
  ];

  return (
    <Box sx={{ flexGrow: 1, bgcolor: colors.light, minHeight: '100vh', fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }}>
      
      {/* Navbar */}
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${colors.secondary}30` }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
               {/* Logo Placeholder (Text for now) */}
              <Typography variant="h5" component="div" sx={{ fontWeight: 800, color: colors.primary, letterSpacing: '-0.5px' }}>
                Speak<Box component="span" sx={{ color: colors.accent }}>Forge</Box>
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              sx={{ 
                color: colors.primary, 
                borderColor: colors.primary,
                borderRadius: '20px',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                '&:hover': { 
                  borderColor: colors.primary,
                  bgcolor: `${colors.primary}10` 
                } 
              }}
              onClick={() => navigate('/admin/login')}
            >
              Admin Login
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}

      {/* Hero Section */}
      <Box 
        sx={{ 
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          color: colors.white, 
          pt: 12,
          pb: 16,
        }}
      >
        {/* Abstract Background Shapes */}
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

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Chip 
            label="Breaking Language Barriers" 
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              mb: 3, 
              fontWeight: 600,
              backdropFilter: 'blur(5px)'
            }} 
          />
          <Typography 
            variant={isMobile ? "h3" : "h1"} 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 900, 
              lineHeight: 1.2,
              mb: 3,
              textShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
          >
            Connect Without <br/>
            <Box component="span" sx={{ color: colors.accent }}>Boundaries</Box>
          </Typography>
          
          <Typography variant="h6" component="p" sx={{ mb: 5, opacity: 0.9, fontWeight: 400, maxWidth: '700px', mx: 'auto', lineHeight: 1.6 }}>
            SpeakForge leverages advanced AI to provide real-time voice and text translation, 
            making communication seamless between Bisaya speakers and the world.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{ 
                bgcolor: colors.accent, 
                color: colors.white,
                fontSize: '1.1rem',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: '50px',
                boxShadow: '0 4px 20px rgba(251, 168, 52, 0.4)',
                '&:hover': { 
                  bgcolor: '#e0962d',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 25px rgba(251, 168, 52, 0.5)',
                },
                transition: 'all 0.3s'
              }}
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Stats/Highlight Bar */}
      <Container maxWidth="lg" sx={{ mt: -6, position: 'relative', zIndex: 2 }}>
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          <Grid container>
            <Grid item xs={12} md={4} sx={{ p: 4, borderRight: { md: `1px solid ${colors.secondary}20` }, borderBottom: { xs: `1px solid ${colors.secondary}20`, md: 'none' } }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: colors.primary }}>99%</Typography>
              <Typography variant="subtitle1" sx={{ color: colors.dark, opacity: 0.7 }}>Translation Accuracy</Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ p: 4, borderRight: { md: `1px solid ${colors.secondary}20` }, borderBottom: { xs: `1px solid ${colors.secondary}20`, md: 'none' } }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: colors.secondary }}>Real-time</Typography>
              <Typography variant="subtitle1" sx={{ color: colors.dark, opacity: 0.7 }}>Latency Processing</Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ p: 4 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: colors.accent }}>24/7</Typography>
              <Typography variant="subtitle1" sx={{ color: colors.dark, opacity: 0.7 }}>Available Service</Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* About Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ 
                bgcolor: colors.secondary, 
                width: '100%', 
                height: '100%', 
                position: 'absolute', 
                top: 20, 
                left: 20, 
                borderRadius: 4,
                zIndex: 0,
                opacity: 0.2
              }} />
              <Paper 
                elevation={0}
                sx={{ 
                  p: 4, 
                  bgcolor: colors.white, 
                  border: `1px solid ${colors.secondary}30`,
                  borderRadius: 4,
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <Typography variant="overline" sx={{ color: colors.accent, fontWeight: 700, letterSpacing: 2 }}>
                  OUR MISSION
                </Typography>
                <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 800, color: colors.dark, mb: 3 }}>
                  Bridging Cultures Through Technology
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.8, mb: 2 }}>
                  SpeakForge is an AI-Powered multilingual communication tool designed to eliminate language barriers.
                  The project addresses the growing need for seamless cross-lingual communication, particularly among
                  international students, tourists, expatriates, and businesses operating in Cebu.
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.8 }}>
                  By leveraging advanced AI-powered translation services and speech recognition technology, 
                  SpeakForge facilitates effortless communication between Bisaya speaking communities and non-native speakers.
                </Typography>
              </Paper>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
             <Grid container spacing={2}>
               <Grid item xs={6}>
                 <Paper elevation={0} sx={{ p: 3, bgcolor: `${colors.primary}10`, height: '100%', borderRadius: 3 }}>
                   <TranslateIcon sx={{ fontSize: 40, color: colors.primary, mb: 2 }} />
                   <Typography variant="h6" sx={{ fontWeight: 700 }}>Smart Translation</Typography>
                   <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>Context-aware processing for natural conversations.</Typography>
                 </Paper>
               </Grid>
               <Grid item xs={6}>
                 <Paper elevation={0} sx={{ p: 3, bgcolor: `${colors.accent}10`, height: '100%', borderRadius: 3, mt: 4 }}>
                   <RecordVoiceOverIcon sx={{ fontSize: 40, color: colors.accent, mb: 2 }} />
                   <Typography variant="h6" sx={{ fontWeight: 700 }}>Voice Recognition</Typography>
                   <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>Advanced speech-to-text capabilities.</Typography>
                 </Paper>
               </Grid>
             </Grid>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: colors.white, py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <Card 
                  elevation={0}
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    p: 2,
                    border: '1px solid #eee',
                    borderRadius: 4,
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
                      borderColor: 'transparent'
                    }
                  }}
                >
                  <Box sx={{ p: 2, display: 'inline-block', borderRadius: '50%', bgcolor: '#f8f9fa', width: 'fit-content', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <CardContent sx={{ p: 1 }}>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Download Android App Section */}
      <Box ref={downloadSectionRef} sx={{ bgcolor: colors.white, py: 10 }}>
        <Container maxWidth="md">
          <Paper 
            elevation={0}
            sx={{ 
              borderRadius: 6,
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              position: 'relative'
            }}
          >
            <Box sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', color: colors.white, position: 'relative', zIndex: 1 }}>
              <AndroidIcon sx={{ fontSize: 60, mb: 2, color: colors.white }} />
              <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 800 }}>
                Get the App
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
                SpeakForge is optimized for Android devices. Download the latest APK to experience seamless real-time translation on your mobile device.
              </Typography>
              
              <Button 
                variant="contained" 
                size="large"
                startIcon={<DownloadIcon />}
                href="https://drive.google.com/file/d/1DH0Zmn5EIG5GUmrsdrhY-8ub2JQlIVSY/view?usp=drive_link"
                target="_blank"
                sx={{ 
                  bgcolor: colors.accent, 
                  color: colors.white,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  px: 5,
                  py: 1.5,
                  borderRadius: '50px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                  '&:hover': { 
                    bgcolor: '#e0962d',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(0, 0, 0, 0.3)',
                  },
                  transition: 'all 0.3s'
                }}
              >
                Download APK
              </Button>
            </Box>

            {/* Background Decorations */}
            <Box sx={{
              position: 'absolute',
              top: -50,
              left: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }} />
             <Box sx={{
              position: 'absolute',
              bottom: -50,
              right: -50,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 0
            }} />
          </Paper>
        </Container>
      </Box>

      {/* Tech Stack */}
      <Box sx={{ bgcolor: colors.light, py: 10 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} justifyContent="center">
            {techStack.map((tech, index) => (
               <Grid item key={index} xs={6} sm={4} md={2}>
                 <Paper 
                   elevation={0}
                   sx={{ 
                     py: 3,
                     px: 2,
                     textAlign: 'center', 
                     borderRadius: 3,
                     bgcolor: colors.white,
                     border: `1px solid ${colors.secondary}20`,
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     gap: 1,
                     transition: 'all 0.2s',
                     '&:hover': {
                       bgcolor: colors.primary,
                       color: colors.white,
                       transform: 'scale(1.05)',
                       '& .MuiSvgIcon-root': { color: colors.white }
                     }
                   }}
                 >
                   <Box sx={{ color: colors.primary }}>
                     {tech.icon}
                   </Box>
                   <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                     {tech.name}
                   </Typography>
                 </Paper>
               </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#1a1a1a', color: '#fff', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, color: colors.white }}>
                Speak<Box component="span" sx={{ color: colors.accent }}>Forge</Box>
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, maxWidth: 300, lineHeight: 1.8 }}>
                Breaking down language barriers one conversation at a time. Join us in making the world a more connected place.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', opacity: 0.7 }}>About Us</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', opacity: 0.7 }}>Features</Button>
                <Button color="inherit" sx={{ justifyContent: 'flex-start', opacity: 0.7 }} onClick={() => navigate('/admin/login')}>Admin Login</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Contact
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>
                Cebu Institute of Technology - University
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                Cebu City, Philippines
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 8, pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.5 }}>
              © {new Date().getFullYear()} SpeakForge. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
