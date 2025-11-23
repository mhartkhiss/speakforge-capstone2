import {
  Card,
  CardContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  ArrowDownward as ArrowDownwardIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';

const DailyActivityTable = ({ usageStats, onViewDetails }) => {
  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 8px 32px rgba(80, 196, 237, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        height: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <AccessTimeIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Daily Activity
            </Typography>
          </Box>
          <Tooltip title="View detailed user activity">
            <IconButton 
              size="small"
              sx={{ 
                background: 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #3a9bc1 0%, #2c5aa0 100%)',
                }
              }}
            >
              <DateRangeIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden', 
          maxHeight: '400px',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '3px',
            '&:hover': {
              background: '#a8a8a8',
            },
          },
        }}>
          {usageStats.dailyLoginUsage && usageStats.dailyLoginUsage.length > 0 ? (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Logins</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Trend</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, backgroundColor: '#f8f9fa' }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usageStats.dailyLoginUsage
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((day, index) => {
                      const prevDay = usageStats.dailyLoginUsage[index + 1];
                      const trend = prevDay ? day.count - prevDay.count : 0;
                      return (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'rgba(56, 122, 223, 0.05)',
                              cursor: 'pointer'
                            }
                          }}
                        >
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {new Date(day.date).toLocaleDateString(undefined, { 
                                  weekday: 'short', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {new Date(day.date).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={day.count}
                              size="small"
                              sx={{
                                background: day.count > 0 ? 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)' : '#e0e0e0',
                                color: 'white',
                                fontWeight: 600,
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {trend !== 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {trend > 0 ? (
                                  <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50', mr: 0.5 }} />
                                ) : (
                                  <ArrowDownwardIcon sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />
                                )}
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: trend > 0 ? '#4caf50' : '#f44336',
                                    fontWeight: 600
                                  }}
                                >
                                  {Math.abs(trend)}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => onViewDetails(day)}
                              sx={{
                                borderColor: '#50C4ED',
                                color: '#50C4ED',
                                borderRadius: 2,
                                px: 1.5,
                                py: 0.25,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                minWidth: 'auto',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)',
                                  color: 'white',
                                  borderColor: '#387ADF'
                                }
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
              <AccessTimeIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="body2" color="textSecondary" align="center">
                No login activity data available
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default DailyActivityTable;
