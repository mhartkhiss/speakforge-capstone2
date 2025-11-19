import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  Tooltip,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  GetApp as GetAppIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const StatisticsControlBar = ({ 
  autoRefresh, 
  onAutoRefreshChange, 
  onRefresh, 
  onExport, 
  isLoading,
  usageStats 
}) => {
  const formatComparisonPeriod = () => {
    if (usageStats?.previousPeriodDate) {
      const previousDate = new Date(usageStats.previousPeriodDate);
      return `vs ${previousDate.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
    return 'vs previous period';
  };

  const getComparisonTooltip = () => {
    if (usageStats?.previousPeriodDate) {
      const previousDate = new Date(usageStats.previousPeriodDate);
      const today = new Date();
      const daysDiff = Math.floor((today - previousDate) / (1000 * 60 * 60 * 24));
      return `Comparing current statistics with data from ${daysDiff} days ago (${previousDate.toLocaleDateString()})`;
    }
    return 'Percentage changes are calculated by comparing current statistics with the most recent available historical data';
  };

  return (
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#387ADF' }}>
              📊 Analytics Dashboard
            </Typography>
            
            {usageStats?.previousPeriodDate && (
              <Tooltip title={getComparisonTooltip()} arrow>
                <Chip
                  icon={<InfoIcon sx={{ fontSize: 16 }} />}
                  label={formatComparisonPeriod()}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: '#387ADF',
                    color: '#387ADF',
                    '& .MuiChip-icon': {
                      color: '#387ADF'
                    }
                  }}
                />
              </Tooltip>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => onAutoRefreshChange(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-refresh"
              sx={{ ml: 2 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh statistics">
              <IconButton
                onClick={onRefresh}
                disabled={isLoading}
                sx={{ 
                  color: '#387ADF',
                  '&:hover': {
                    backgroundColor: 'rgba(56, 122, 223, 0.1)'
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={20} sx={{ color: '#387ADF' }} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Export to CSV">
              <Button
                variant="outlined"
                startIcon={<GetAppIcon />}
                onClick={onExport}
                disabled={isLoading}
                sx={{
                  borderColor: '#387ADF',
                  color: '#387ADF',
                  '&:hover': {
                    borderColor: '#2c5aa0',
                    backgroundColor: 'rgba(56, 122, 223, 0.1)'
                  }
                }}
              >
                Export
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        {usageStats?.calculatedAt && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
              Last updated: {new Date(usageStats.calculatedAt).toLocaleString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsControlBar; 