import {
  Card,
  CardContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';

const UsersControlBar = ({ 
  searchQuery, 
  onSearchChange, 
  onClearSearch, 
  onRefresh, 
  onAddUser, 
  isRefreshing 
}) => {
  return (
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#387ADF' }}>
              👥 Users Management
            </Typography>
            
            <TextField
              size="small"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              sx={{ 
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#387ADF' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={onClearSearch}
                      edge="end"
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={isRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
              onClick={onRefresh}
              disabled={isRefreshing}
              sx={{
                borderColor: '#50C4ED',
                color: '#50C4ED',
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)',
                  color: 'white',
                  borderColor: '#387ADF'
                }
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={onAddUser}
              sx={{
                background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                boxShadow: '0 4px 15px rgba(56, 122, 223, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2c5aa0 0%, #3a9bc1 100%)',
                  boxShadow: '0 6px 20px rgba(56, 122, 223, 0.4)',
                }
              }}
            >
              Add New User
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default UsersControlBar; 