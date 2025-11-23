import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box
} from '@mui/material';
import {
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Star as StarIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon
} from '@mui/icons-material';

const StatisticsCards = ({ usageStats, selectedPeriod }) => {
  // Helper function to get dynamic period label
  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case '7d': return 'Active Last 7 Days';
      case '1m': return 'Active Last Month';
      case '3m': return 'Active Last 3 Months';
      case '6m': return 'Active Last 6 Months';
      case '1y': return 'Active Last Year';
      default: return 'Active Last 7 Days';
    }
  };

  // Helper function to get trend icon and color based on percentage
  const getTrendInfo = (trendString) => {
    if (!trendString) return { icon: <TrendingFlatIcon sx={{ fontSize: 16 }} />, color: '#9e9e9e' };
    
    const isPositive = trendString.startsWith('+');
    const isNegative = trendString.startsWith('-');
    const isZero = trendString === '0%' || trendString === '+0.0%';
    
    if (isZero) {
      return { icon: <TrendingFlatIcon sx={{ fontSize: 16 }} />, color: '#9e9e9e' };
    } else if (isPositive) {
      return { icon: <TrendingUpIcon sx={{ fontSize: 16 }} />, color: '#4caf50' };
    } else if (isNegative) {
      return { icon: <TrendingDownIcon sx={{ fontSize: 16 }} />, color: '#f44336' };
    } else {
      return { icon: <TrendingFlatIcon sx={{ fontSize: 16 }} />, color: '#9e9e9e' };
    }
  };

  const statsData = [
    { 
      title: 'Total Users', 
      value: usageStats.totalUsers || 0, 
      icon: <PeopleIcon sx={{ fontSize: 32 }} />, 
      gradient: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
      shadowColor: 'rgba(56, 122, 223, 0.3)',
      trend: usageStats.trends?.totalUsers || '+0%',
      trendInfo: getTrendInfo(usageStats.trends?.totalUsers)
    },
    { 
      title: getPeriodLabel(), 
      value: usageStats.activeUsersLast7Days || 0, 
      icon: <AccessTimeIcon sx={{ fontSize: 32 }} />, 
      gradient: 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)',
      shadowColor: 'rgba(80, 196, 237, 0.3)',
      trend: usageStats.trends?.activeUsersLast7Days || '+0%',
      trendInfo: getTrendInfo(usageStats.trends?.activeUsersLast7Days)
    },
    { 
      title: 'Premium Users', 
      value: usageStats.premiumUsers || 0, 
      icon: <StarIcon sx={{ fontSize: 32 }} />, 
      gradient: 'linear-gradient(135deg, #FBA834 0%, #ff9800 100%)',
      shadowColor: 'rgba(251, 168, 52, 0.3)',
      trend: usageStats.trends?.premiumUsers || '+0%',
      trendInfo: getTrendInfo(usageStats.trends?.premiumUsers)
    },
    { 
      title: 'Free Users', 
      value: usageStats.freeUsers || 0, 
      icon: <PersonIcon sx={{ fontSize: 32 }} />, 
      gradient: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
      shadowColor: 'rgba(108, 117, 125, 0.3)',
      trend: usageStats.trends?.freeUsers || '+0%',
      trendInfo: getTrendInfo(usageStats.trends?.freeUsers)
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
      {statsData.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card 
            elevation={0}
            sx={{ 
              height: '100%',
              borderRadius: 3,
              background: 'white',
              boxShadow: `0 8px 32px ${stat.shadowColor}`,
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: `0 16px 48px ${stat.shadowColor}`,
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: stat.gradient,
              }
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Box 
                sx={{ 
                  background: stat.gradient,
                  borderRadius: '50%',
                  width: 70,
                  height: 70,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: 'white',
                  boxShadow: `0 4px 20px ${stat.shadowColor}`,
                }}
              >
                {stat.icon}
              </Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 700, 
                  background: stat.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                {stat.value.toLocaleString()}
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#6c757d',
                  fontWeight: 500,
                  fontSize: '0.95rem',
                  mb: 1
                }}
              >
                {stat.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                <Box sx={{ color: stat.trendInfo.color, display: 'flex', alignItems: 'center' }}>
                  {stat.trendInfo.icon}
                  <Typography variant="caption" sx={{ fontWeight: 600, ml: 0.5 }}>
                    {stat.trend}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                  vs last period
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatisticsCards;
