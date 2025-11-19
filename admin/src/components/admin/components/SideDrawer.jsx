import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme
} from '@mui/material';
// Icons removed - using emojis in labels instead

const SideDrawer = ({ open, onClose, currentTab, onTabChange }) => {
  const theme = useTheme();

  const handleTabClick = (tab) => {
    onTabChange(tab);
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
          position: 'fixed',
          top: 64,
          left: 0,
          width: 240,
          height: 'calc(100vh - 64px)',
          boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
          border: 'none',
          backgroundColor: theme.palette.background.paper,
          transition: theme.transitions.create('transform', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Box sx={{ overflow: 'auto', p: 2 }}>
        <List>
          <ListItem
            button
            onClick={() => handleTabClick('users')}
            selected={currentTab === 'users'}
          >
            <ListItemText primary="👥 Users Management" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleTabClick('statistics')}
            selected={currentTab === 'statistics'}
          >
            <ListItemText primary="📊 Usage Statistics" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleTabClick('api-usage')}
            selected={currentTab === 'api-usage'}
          >
            <ListItemText primary="🔗 API Usage" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleTabClick('settings')}
            selected={currentTab === 'settings'}
          >
            <ListItemText primary="⚙️ Settings" />
          </ListItem>
          <ListItem
            button
            onClick={() => handleTabClick('database')}
            selected={currentTab === 'database'}
          >
            <ListItemText primary="🗄️ Database" />
          </ListItem>
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
};

export default SideDrawer; 