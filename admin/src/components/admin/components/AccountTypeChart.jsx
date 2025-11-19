import {
  Card,
  CardContent,
  Box,
  Typography
} from '@mui/material';
import {
  DonutLarge as DonutLargeIcon
} from '@mui/icons-material';
import { Doughnut } from 'react-chartjs-2';

const AccountTypeChart = ({ usageStats }) => {
  const getAccountTypeChartData = () => {
    return {
      labels: ['Premium Users', 'Free Users'],
      datasets: [
        {
          data: [usageStats.premiumUsers || 0, usageStats.freeUsers || 0],
          backgroundColor: ['#FBA834', '#6c757d'],
          borderColor: ['#FBA834CC', '#6c757dCC'],
          borderWidth: 2,
          hoverBorderWidth: 4,
          hoverOffset: 10
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '600'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#FBA834',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.raw / total) * 100).toFixed(1);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
    elements: {
      arc: {
        borderWidth: 2
      }
    }
  };

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 8px 32px rgba(251, 168, 52, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        height: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              background: 'linear-gradient(135deg, #FBA834 0%, #ff9800 100%)',
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <DonutLargeIcon sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #FBA834 0%, #ff9800 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Account Types
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(usageStats.premiumUsers > 0 || usageStats.freeUsers > 0) ? (
            <Box sx={{ width: '100%', height: '300px' }}>
              <Doughnut
                data={getAccountTypeChartData()}
                options={chartOptions}
              />
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <DonutLargeIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="body2" color="textSecondary">
                No account data available
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AccountTypeChart; 