import React, { useRef, useEffect, useState } from 'react';
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
  Chip,
  IconButton,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, get } from 'firebase/database';
import app from '../firebase';
import logo from '../assets/speakforgelogo_light.png';
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
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import TuneIcon from '@mui/icons-material/Tune';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AccessTimeIcon from '@mui/icons-material/AccessTime';


const LandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const downloadSectionRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [apkDownloadUrl, setApkDownloadUrl] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadApkDownloadUrl = async () => {
      try {
        const db = getDatabase(app);
        const settingsRef = ref(db, 'settings');

        const snapshot = await get(settingsRef);
        if (snapshot.exists()) {
          const settings = snapshot.val();
          const url = settings.apkDownloadUrl;
          if (url) {
            setApkDownloadUrl(url);
          }
        }
      } catch (error) {
        console.error('Error loading APK download URL from Firebase:', error);
        // Fallback to hardcoded URL if Firebase fails
        setApkDownloadUrl('https://drive.google.com/file/d/1DH0Zmn5EIG5GUmrsdrhY-8ub2JQlIVSY/view?usp=drive_link');
      }
    };

    loadApkDownloadUrl();
  }, []);

  const handleGetStarted = () => {
    downloadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Premium Brand Colors
  const colors = {
    primary: '#2563EB', // Vibrant Blue
    secondary: '#0EA5E9', // Sky Blue
    accent: '#F59E0B', // Amber
    dark: '#0F172A', // Slate 900
    light: '#F8FAFC', // Slate 50
    white: '#FFFFFF',
    text: '#334155', // Slate 700
    textLight: '#64748B', // Slate 500
    gradient: 'linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)',
    glass: 'rgba(255, 255, 255, 0.8)'
  };

  const features = [
    {
      title: 'English ↔ Bisaya Translation',
      description: 'Specialized real-time translation between English and Cebuano. Future updates will bring support for more global languages.',
      icon: <TranslateIcon fontSize="large" sx={{ color: colors.primary }} />
    },
    {
      title: 'Voice-to-Text',
      description: 'Speak naturally in your native language and have it transcribed and translated instantly.',
      icon: <RecordVoiceOverIcon fontSize="large" sx={{ color: colors.accent }} />
    },
    {
      title: 'Context-Aware Conversation',
      description: 'Powered by advanced AI that understands more than just words. It detects conversation history and local nuances to deliver accurate, culturally relevant translations that generic apps miss.',
      icon: <PsychologyIcon fontSize="large" sx={{ color: colors.secondary }} />
    },
    {
      title: 'Adaptive Tone Control',
      description: 'Communicate with the right intent every time. Easily toggle between "Formal" and "Casual" modes to ensure your message suits the situation, whether it\'s a professional inquiry or a friendly conversation.',
      icon: <TuneIcon fontSize="large" sx={{ color: colors.primary }} />
    },
    {
      title: 'Secure & Private',
      description: 'Enterprise-grade security ensuring your conversations remain private and protected.',
      icon: <SecurityIcon fontSize="large" sx={{ color: colors.accent }} />
    },
    {
      title: 'Admin Dashboard',
      description: 'Powerful tools for user management, analytics, and system configuration.',
      icon: <DashboardIcon fontSize="large" sx={{ color: colors.secondary }} />
    }
  ];

  const techStack = [
    { name: 'Android', icon: <AndroidIcon fontSize="large" /> },
    { name: 'React', icon: <CodeIcon fontSize="large" /> },
    { name: 'Django', icon: <StorageIcon fontSize="large" /> },
    { name: 'Firebase', icon: <CloudIcon fontSize="large" /> },
    { name: 'Gemini AI', icon: <PsychologyIcon fontSize="large" /> }
  ];

  const teamMembers = [
    { name: 'Mhart Khiss T. Degollacion', role: 'Frontend, Backend' },
    { name: 'Franz Jason C. Dolores', role: 'Frontend, Web' },
    { name: 'Nap Adriel B. Derecho', role: 'Frontend, Mobile' },
    { name: 'Christ Amron A. Luzon', role: 'Frontend, Web' },
    { name: 'John David R. Catulong', role: 'UI Design, Project Management' }
  ];

  return (
    <Box sx={{
      flexGrow: 1,
      bgcolor: colors.light,
      minHeight: '100vh',
      fontFamily: '"Outfit", sans-serif',
      overflowX: 'hidden'
    }}>

      {/* Navbar */}
      <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          bgcolor: scrolled ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${colors.textLight}20` : 'none',
          transition: 'all 0.3s ease',
          py: 1
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                component="img"
                src={logo}
                alt="SpeakForge Logo"
                sx={{
                  height: 45,
                  filter: scrolled ? 'none' : 'brightness(0) invert(1)'
                }}
              />
              <Typography variant="h5" component="div" sx={{
                fontWeight: 800,
                letterSpacing: '-0.5px'
              }}>
                <Box component="span" sx={{ color: scrolled ? colors.accent : colors.white }}>Speak</Box>
                <Box component="span" sx={{ color: scrolled ? colors.primary : colors.white }}>Forge</Box>
              </Typography>
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={() => navigate('/admin/login')}
                  sx={{
                    color: scrolled ? colors.primary : colors.white,
                    fontWeight: 600,
                    '&:hover': { bgcolor: scrolled ? `${colors.primary}10` : 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={handleGetStarted}
                  sx={{
                    bgcolor: scrolled ? colors.primary : colors.white,
                    color: scrolled ? colors.white : colors.primary,
                    fontWeight: 700,
                    borderRadius: '50px',
                    px: 3,
                    '&:hover': {
                      bgcolor: scrolled ? colors.secondary : '#f0f0f0',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  Get App
                </Button>
              </Box>
            )}

            {isMobile && (
              <Button
                variant="contained"
                onClick={handleGetStarted}
                sx={{
                  bgcolor: scrolled ? colors.primary : colors.white,
                  color: scrolled ? colors.white : colors.primary,
                  fontWeight: 700,
                  borderRadius: '50px',
                  px: 3,
                  '&:hover': {
                    bgcolor: scrolled ? colors.secondary : '#f0f0f0',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                Get App
              </Button>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          background: colors.gradient,
          color: colors.white,
          pt: { xs: 15, md: 20 },
          pb: { xs: 15, md: 25 },
          clipPath: { md: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)' }
        }}
      >
        {/* Animated Background Shapes */}
        <Box className="animate-float" sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(5px)',
          zIndex: 0
        }} />
        <Box className="animate-float" sx={{
          position: 'absolute',
          bottom: '20%',
          left: '5%',
          width: 200,
          height: 200,
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          animationDelay: '1s',
          zIndex: 0
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7} className="animate-fade-in">
              <Chip
                label="🚀 Breaking Language Barriers"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  mb: 3,
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '3rem', md: '4.5rem' },
                  lineHeight: 1.1,
                  mb: 3,
                  textShadow: '0 2px 20px rgba(0,0,0,0.1)'
                }}
              >
                Connect Without <br />
                <Box component="span" sx={{
                  color: 'transparent',
                  background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text'
                }}>
                  Boundaries
                </Box>
              </Typography>

              <Typography variant="h6" sx={{ mb: 5, opacity: 0.9, fontWeight: 300, maxWidth: '600px', lineHeight: 1.6 }}>
                SpeakForge leverages advanced AI to provide real-time voice and text translation,
                bridging the gap between <strong>English and Cebuano (Bisaya)</strong> speakers.
                <br />
                <Box component="span" sx={{ fontSize: '0.9em', opacity: 0.8, display: 'block', mt: 1 }}>
                  * More languages coming soon!
                </Box>
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleGetStarted}
                  sx={{
                    bgcolor: colors.white,
                    color: colors.primary,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    px: 4,
                    py: 1.5,
                    borderRadius: '50px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    '&:hover': {
                      bgcolor: '#f8f9fa',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    }
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<GitHubIcon />}
                  href="https://github.com/mhartkhiss/speakforge-capstone2"
                  target="_blank"
                  sx={{
                    color: colors.white,
                    borderColor: 'rgba(255,255,255,0.5)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: '50px',
                    '&:hover': {
                      borderColor: colors.white,
                      bgcolor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  View Code
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box className="animate-float" sx={{ position: 'relative' }}>
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  left: -20,
                  right: -20,
                  bottom: -20,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '30px',
                  transform: 'rotate(-6deg)',
                  zIndex: 0
                }} />
                <Paper elevation={24} sx={{
                  p: 3,
                  borderRadius: '24px',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  position: 'relative',
                  zIndex: 1,
                  transform: 'rotate(3deg)',
                  maxWidth: 350,
                  mx: 'auto'
                }}>
                  {/* Mock Chat Interface */}
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: colors.primary, width: 32, height: 32 }}>U</Avatar>
                    <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: '12px 12px 12px 0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Maayong Buntag! Kumusta ka?</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'row-reverse' }}>
                    <Avatar sx={{ bgcolor: colors.accent, width: 32, height: 32 }}>A</Avatar>
                    <Box sx={{ bgcolor: colors.primary, color: 'white', p: 1.5, borderRadius: '12px 12px 0 12px' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Good morning! How are you?</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: colors.primary, width: 32, height: 32 }}>U</Avatar>
                    <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: '12px 12px 12px 0' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Gutom na ko, mangaon ta.</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2, p: 1, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RecordVoiceOverIcon color="action" fontSize="small" />
                    <Box sx={{ height: 4, flexGrow: 1, bgcolor: '#e2e8f0', borderRadius: 2 }}>
                      <Box sx={{ width: '60%', height: '100%', bgcolor: colors.accent, borderRadius: 2 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">0:05</Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mt: { xs: 5, md: -10 }, position: 'relative', zIndex: 2, mb: 10 }}>
        <Grid container spacing={3} justifyContent="center">
          {[
            {
              value: '90%',
              label: 'Translation Accuracy',
              icon: VerifiedUserIcon,
              color: colors.primary,
              desc: 'Industry leading precision'
            },
            {
              value: '<200ms',
              label: 'Processing Latency',
              icon: SpeedIcon,
              color: colors.secondary,
              desc: 'May vary on internet connection'
            },
            {
              value: '24/7',
              label: 'System Availability',
              icon: AccessTimeIcon,
              color: colors.accent,
              desc: 'Always on, always ready'
            }
          ].map((stat, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-10px)',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ mb: 2, display: 'inline-flex', p: 1.5, borderRadius: '50%', bgcolor: `${stat.color}15` }}>
                  <stat.icon sx={{ fontSize: 40, color: stat.color }} />
                </Box>
                <Typography variant="h3" sx={{
                  fontWeight: 800,
                  mb: 1,
                  color: stat.color
                }}>
                  {stat.value}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.dark, mb: 0.5 }}>
                  {stat.label}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textLight }}>
                  {stat.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ py: 10, bgcolor: colors.light }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: colors.primary, fontWeight: 700, letterSpacing: 2 }}>
              POWERFUL FEATURES
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: colors.dark, mt: 1 }}>
              Everything you need to communicate
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {features.map((feature, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    p: 3,
                    borderRadius: 4,
                    bgcolor: colors.white,
                    border: '1px solid transparent',
                    transition: 'all 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-10px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                      borderColor: `${colors.primary}20`
                    }
                  }}
                >
                  <Box sx={{
                    p: 2,
                    display: 'inline-flex',
                    borderRadius: '20px',
                    bgcolor: `${colors.light}`,
                    width: 'fit-content',
                    mb: 3
                  }}>
                    {feature.icon}
                  </Box>
                  <CardContent sx={{ p: 0 }}>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 700, color: colors.dark }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.textLight, lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Grid container spacing={8} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{
                position: 'absolute',
                top: -20,
                left: -20,
                width: '100%',
                height: '100%',
                bgcolor: colors.secondary,
                borderRadius: 4,
                opacity: 0.1,
                zIndex: 0
              }} />
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  bgcolor: colors.white,
                  border: `1px solid ${colors.light}`,
                  borderRadius: 4,
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="overline" sx={{ color: colors.accent, fontWeight: 700, letterSpacing: 2 }}>
                  OUR MISSION
                </Typography>
                <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 800, color: colors.dark, mt: 1, mb: 3 }}>
                  Bridging Cultures Through Technology
                </Typography>
                <Typography variant="body1" sx={{ color: colors.textLight, lineHeight: 1.8, mb: 3, fontSize: '1.1rem' }}>
                  SpeakForge is an AI-Powered communication tool designed to eliminate language barriers in Cebu.
                  Currently specialized for <strong>English to Bisaya (Cebuano)</strong> translation, we aim to expand to more languages
                  in the future to further support international students, tourists, and businesses.
                </Typography>
                <Button
                  variant="text"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ color: colors.primary, fontWeight: 700, fontSize: '1rem', p: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                >
                  Learn more about us
                </Button>
              </Paper>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 4, bgcolor: '#EFF6FF', height: '100%', borderRadius: 4, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
                  <TranslateIcon sx={{ fontSize: 40, color: colors.primary, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: colors.dark }}>Smart Translation</Typography>
                  <Typography variant="body2" sx={{ color: colors.textLight, mt: 1 }}>Context-aware processing for natural conversations.</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper elevation={0} sx={{ p: 4, bgcolor: '#FFF7ED', height: '100%', borderRadius: 4, mt: 6, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
                  <RecordVoiceOverIcon sx={{ fontSize: 40, color: colors.accent, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, color: colors.dark }}>Voice Recognition</Typography>
                  <Typography variant="body2" sx={{ color: colors.textLight, mt: 1 }}>Advanced speech-to-text capabilities.</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>

      {/* Team Section */}
      <Box sx={{ py: 10, bgcolor: colors.white }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="overline" sx={{ color: colors.accent, fontWeight: 700, letterSpacing: 2 }}>
              THE TEAM
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: colors.dark, mt: 1 }}>
              Meet the Minds Behind SpeakForge
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {teamMembers.map((member, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: colors.light,
                    border: '1px solid transparent',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                      bgcolor: colors.white,
                      borderColor: `${colors.primary}20`
                    }
                  }}
                >
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: [colors.primary, colors.secondary, colors.accent][index % 3],
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                    }}
                  >
                    {member.name.split(' ')[0][0]}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: colors.dark, mb: 0.5 }}>
                    {member.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textLight }}>
                    {member.role}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Download Section */}
      <Box ref={downloadSectionRef} sx={{ py: 10 }}>
        <Container maxWidth="md">
          <Paper
            elevation={0}
            sx={{
              borderRadius: 6,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <Box sx={{ p: { xs: 5, md: 10 }, textAlign: 'center', color: colors.white, position: 'relative', zIndex: 1 }}>
              <AndroidIcon sx={{ fontSize: 70, mb: 3, color: colors.accent }} />
              <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 800 }}>
                Experience SpeakForge on Mobile
              </Typography>
              <Typography variant="h6" sx={{ mb: 5, opacity: 0.8, maxWidth: '600px', mx: 'auto', fontWeight: 300, lineHeight: 1.6 }}>
                Help us improve the quality of life for foreigners in Cebu—download our AI language-assist app and join our feature testing today.
              </Typography>

              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                href={apkDownloadUrl || 'https://drive.google.com/file/d/1DH0Zmn5EIG5GUmrsdrhY-8ub2JQlIVSY/view?usp=drive_link'}
                target="_blank"
                disabled={!apkDownloadUrl}
                sx={{
                  bgcolor: colors.primary,
                  color: colors.white,
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  px: 6,
                  py: 2,
                  borderRadius: '50px',
                  boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
                  '&:hover': {
                    bgcolor: '#1d4ed8',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 30px rgba(37, 99, 235, 0.5)',
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                    color: '#666',
                    transform: 'none',
                    boxShadow: 'none'
                  },
                  transition: 'all 0.3s'
                }}
              >
                {apkDownloadUrl ? 'Download APK' : 'Loading...'}
              </Button>
            </Box>

            {/* Decorative Circles */}
            <Box sx={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(37,99,235,0) 70%)',
              zIndex: 0
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0) 70%)',
              zIndex: 0
            }} />
          </Paper>
        </Container>
      </Box>

      {/* Tech Stack */}
      <Box sx={{ bgcolor: colors.white, py: 10, borderTop: `1px solid ${colors.light}` }}>
        <Container maxWidth="lg">
          <Typography variant="h6" align="center" sx={{ mb: 6, color: colors.textLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Powered by Modern Technologies
          </Typography>
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            {techStack.map((tech, index) => (
              <Grid item key={index} xs={6} sm={4} md={2}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    opacity: 0.7,
                    color: colors.textLight,
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 1,
                      transform: 'translateY(-5px)',
                      color: colors.primary
                    }
                  }}
                >
                  {tech.icon}
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {tech.name}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: colors.dark, color: colors.white, pt: 10, pb: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={8}>
            <Grid item xs={12} md={12} sx={{ textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Box component="img" src={logo} alt="SpeakForge Logo" sx={{ height: 40, mr: 2, filter: 'brightness(0) invert(1)' }} />
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                  SpeakForge
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 600, mx: 'auto', lineHeight: 1.8, mb: 4 }}>
                Breaking down language barriers one conversation at a time. Join us in making the world a more connected place through innovative AI-powered translation technology.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '&:hover': { bgcolor: colors.primary } }}>
                  <GitHubIcon />
                </IconButton>
                <IconButton sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'white', '&:hover': { bgcolor: colors.secondary } }}>
                  <TwitterIcon />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>

          <Box sx={{
            mt: 8,
            pt: 4,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2
          }}>
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: { xs: 'center', sm: 'left' } }}>
              © {new Date().getFullYear()} SpeakForge. Group 35 Capstone 2.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Powered by
              </Typography>
              <Chip
                icon={<PsychologyIcon sx={{ '&&': { color: colors.white } }} />}
                label="Gemini AI"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: '0.75rem',
                  height: 28
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;

