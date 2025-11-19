import {
  Box,
  Tabs,
  Tab
} from '@mui/material';
// Icons removed - using emojis in labels instead

const TabNavigation = ({ currentTab, onTabChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={currentTab} 
        onChange={(event, newValue) => onTabChange(newValue)}
        sx={{
          '& .MuiTab-root': {
            fontWeight: 600,
            fontSize: '1rem',
            textTransform: 'none',
            minHeight: 60,
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }
          },
          '& .MuiTabs-indicator': {
            background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
            height: 3,
            borderRadius: 2,
          }
        }}
      >
        <Tab
          label="👥 Users Management"
          value="users"
        />
        <Tab
          label="📊 Usage Statistics"
          value="statistics"
        />
        <Tab
          label="🔗 API Usage"
          value="api-usage"
        />
        <Tab
          label="⚙️ Settings"
          value="settings"
        />
        <Tab
          label="🗄️ Database"
          value="database"
        />
      </Tabs>
    </Box>
  );
};

export default TabNavigation; 