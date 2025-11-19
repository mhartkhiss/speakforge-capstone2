import {
  Card,
  CardContent,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';

const TimePeriodSelector = ({ selectedPeriod, onPeriodChange, isLoading }) => {
  const periodOptions = [
    { value: '7d', label: '7 Days' },
    { value: '1m', label: '1 Month' },
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' }
  ];

  const getPeriodLabel = () => {
    const option = periodOptions.find(opt => opt.value === selectedPeriod);
    return option ? option.label : '7 Days';
  };

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 8px 32px rgba(56, 122, 223, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        mb: 3
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <TimelineIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5
                }}
              >
                Analytics Time Period
              </Typography>
              <Typography 
                variant="body2" 
                color="textSecondary"
              >
                Select time range for all charts and statistics below
              </Typography>
            </Box>
          </Box>
          
          <FormControl size="medium" sx={{ minWidth: 160 }}>
            <InputLabel 
              sx={{ 
                color: '#387ADF',
                '&.Mui-focused': {
                  color: '#387ADF'
                }
              }}
            >
              Time Period
            </InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              disabled={isLoading}
              label="Time Period"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#387ADF',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2c5aa0',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#387ADF',
                }
              }}
              startAdornment={
                <DateRangeIcon sx={{ fontSize: 18, mr: 1, color: '#387ADF' }} />
              }
            >
              {periodOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimePeriodSelector; 