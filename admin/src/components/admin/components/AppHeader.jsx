import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  Avatar,
  useTheme,
  Container
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const AppHeader = ({ onMenuToggle, onLogout }) => {
  const theme = useTheme();

  // Brand Colors
  const colors = {
    primary: '#387ADF',
    secondary: '#50C4ED',
    accent: '#FBA834',
    white: '#FFFFFF'
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Container maxWidth="xl" disableGutters>
        <Toolbar sx={{ px: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Box 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                p: 0.5, 
                borderRadius: 1, 
                mr: 1.5,
                display: 'flex'
              }}
            >
              <AdminIcon sx={{ color: colors.white }} />
            </Box>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 700, 
                letterSpacing: 0.5,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)' 
              }}
            >
              SpeakForge <Typography component="span" variant="h6" sx={{ fontWeight: 300, opacity: 0.9 }}>Admin</Typography>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ mr: 1, opacity: 0.9, fontWeight: 500 }}>
                Administrator
              </Typography>
              <Avatar 
                sx={{ 
                  bgcolor: colors.accent, 
                  width: 35, 
                  height: 35,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <PersonIcon fontSize="small" />
              </Avatar>
            </Box>
            
            <Button 
              color="inherit" 
              onClick={onLogout}
              sx={{ 
                textTransform: 'none',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                borderRadius: 2,
                px: 2,
                minWidth: 'auto'
              }}
            >
              <LogoutIcon fontSize="small" sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Logout</Box>
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default AppHeader;
