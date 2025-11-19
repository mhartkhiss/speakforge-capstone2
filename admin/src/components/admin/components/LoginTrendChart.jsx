import {
  Card,
  CardContent,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';

const LoginTrendChart = ({ usageStats, chartType, onChartTypeChange, selectedPeriod, isLoading }) => {
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

  const getChartData = () => {
    if (!usageStats.dailyLoginUsage || usageStats.dailyLoginUsage.length === 0) {
      return null;
    }

    // Sort the data by date to ensure chronological order (oldest to newest)
    // This ensures the latest date appears on the right side of the chart
    const sortedData = [...usageStats.dailyLoginUsage].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const labels = sortedData.map(day => 
      new Date(day.date).toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    );
    const data = sortedData.map(day => day.count);

    return {
      labels,
      datasets: [
        {
          label: 'Daily Logins',
          data,
          borderColor: '#387ADF',
          backgroundColor: 'rgba(56, 122, 223, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#387ADF',
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          borderWidth: 3,
          shadowOffsetX: 3,
          shadowOffsetY: 3,
          shadowBlur: 10,
          shadowColor: 'rgba(56, 122, 223, 0.3)'
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top',
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
        borderColor: '#387ADF',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} users`;
          },
          title: function(context) {
            return context[0].label + ' (Latest →)';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          precision: 0,
          font: {
            size: 11
          }
        }
      }
    },
    elements: {
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 3
      }
    }
  };

  const barChartData = getChartData() ? {
    ...getChartData(),
    datasets: [{
      ...getChartData().datasets[0],
      backgroundColor: 'rgba(56, 122, 223, 0.8)',
      borderColor: '#387ADF',
      borderWidth: 2,
      borderRadius: 4,
      borderSkipped: false,
    }]
  } : null;

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 8px 32px rgba(56, 122, 223, 0.15)',
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
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Daily Login Trend ({getPeriodLabel()})
            </Typography>
          </Box>
          
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(event, newType) => newType && onChartTypeChange(newType)}
            size="small"
            className="chart-toggle"
            sx={{ 
              '& .MuiToggleButton-root': {
                borderRadius: 2,
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2c5aa0 0%, #3a9bc1 100%)',
                  }
                }
              }
            }}
          >
            <ToggleButton value="line">
              <ShowChartIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Line
            </ToggleButton>
            <ToggleButton value="bar">
              <BarChartIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Bar
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ flex: 1, height: '400px', position: 'relative' }} className="chart-container">
          {isLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
              <CircularProgress size={40} sx={{ color: '#387ADF', mb: 2 }} />
              <Typography variant="body2" color="textSecondary" align="center">
                Loading chart data...
              </Typography>
            </Box>
          ) : getChartData() ? (
            chartType === 'line' ? (
              <Line data={getChartData()} options={chartOptions} />
            ) : (
              <Bar data={barChartData} options={chartOptions} />
            )
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
              <BarChartIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="body2" color="textSecondary" align="center">
                No login data available for chart
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LoginTrendChart; 