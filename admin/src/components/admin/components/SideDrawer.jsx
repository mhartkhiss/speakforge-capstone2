import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Typography
} from '@mui/material';
import {
  People as PeopleIcon,
  BarChart as BarChartIcon,
  IntegrationInstructions as ApiIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

const SideDrawer = ({ open, onClose, currentTab, onTabChange }) => {
  const theme = useTheme();

  // Brand Colors
  const colors = {
    primary: '#387ADF',
    secondary: '#50C4ED',
    selectedBg: '#387ADF15',
    hoverBg: '#387ADF08'
  };

  const menuItems = [
    { id: 'users', label: 'Users Management', icon: <PeopleIcon /> },
    { id: 'statistics', label: 'Usage Statistics', icon: <BarChartIcon /> },
    { id: 'api-usage', label: 'API Usage', icon: <ApiIcon /> },
    { id: 'database', label: 'Database', icon: <StorageIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  const handleTabClick = (tab) => {
    onTabChange(tab);
    // Only close on mobile if needed, but standard drawer behavior usually keeps it open or temporary
    // Assuming temporary drawer based on props
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          bgcolor: '#ffffff',
          boxShadow: '4px 0 24px rgba(0,0,0,0.05)',
          borderRight: 'none',
        },
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(2px)'
        }
      }}
    >
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#f8f9fa',
        borderBottom: '1px solid #eee'
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#444' }}>
          Navigation
        </Typography>
        <Box 
          onClick={onClose}
          sx={{ 
            cursor: 'pointer',
            display: 'flex', 
            alignItems: 'center', 
            opacity: 0.5, 
            '&:hover': { opacity: 1 } 
          }}
        >
          <ChevronLeftIcon />
        </Box>
      </Box>

      <Box sx={{ overflow: 'auto', py: 2 }}>
        <List sx={{ px: 2 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              selected={currentTab === item.id}
              sx={{
                borderRadius: 2,
                mb: 1,
                py: 1.5,
                '&.Mui-selected': {
                  bgcolor: colors.selectedBg,
                  color: colors.primary,
                  '&:hover': {
                    bgcolor: colors.selectedBg,
                  },
                  '& .MuiListItemIcon-root': {
                    color: colors.primary,
                  }
                },
                '&:hover': {
                  bgcolor: colors.hoverBg,
                }
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40, 
                color: currentTab === item.id ? colors.primary : '#757575' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ 
                  fontWeight: currentTab === item.id ? 600 : 500,
                  fontSize: '0.95rem'
                }} 
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
      
      <Box sx={{ mt: 'auto', p: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          SpeakForge Admin v1.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default SideDrawer;
