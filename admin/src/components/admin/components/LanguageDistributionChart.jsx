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
  TableRow
} from '@mui/material';
import {
  Language as LanguageIcon
} from '@mui/icons-material';
import { Pie } from 'react-chartjs-2';

const LanguageDistributionChart = ({ usageStats }) => {
  const getLanguageChartData = () => {
    if (!usageStats.languageDistribution || Object.keys(usageStats.languageDistribution).length === 0) {
      return null;
    }

    const languages = Object.keys(usageStats.languageDistribution);
    const counts = Object.values(usageStats.languageDistribution);
    
    const colors = [
      '#387ADF', '#50C4ED', '#FBA834', '#ff9800', '#4caf50', 
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#00bcd4'
    ];

    return {
      labels: languages,
      datasets: [
        {
          data: counts,
          backgroundColor: colors.slice(0, languages.length),
          borderColor: colors.slice(0, languages.length).map(color => color + 'CC'),
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
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11,
            weight: '600'
          },
          generateLabels: function(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const total = dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  strokeStyle: dataset.borderColor[i],
                  lineWidth: dataset.borderWidth,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
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
            return `${context.label}: ${context.raw} users (${percentage}%)`;
          }
        }
      }
    },
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
            <LanguageIcon sx={{ color: 'white', fontSize: 20 }} />
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
            Language Distribution
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {getLanguageChartData() ? (
            <>
              <Box sx={{ height: '250px', mb: 2 }}>
                <Pie
                  data={getLanguageChartData()}
                  options={chartOptions}
                />
              </Box>
              <Box sx={{ 
                flex: 1, 
                overflow: 'auto', 
                maxHeight: '150px',
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
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Language</TableCell>
                        <TableCell align="right">Users</TableCell>
                        <TableCell align="right">%</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(usageStats.languageDistribution)
                        .sort(([,a], [,b]) => b - a)
                        .map(([language, count], index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Box 
                                  sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    backgroundColor: getLanguageChartData().datasets[0].backgroundColor[index],
                                    mr: 1 
                                  }} 
                                />
                                {language}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight="bold">
                                {count}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="textSecondary">
                                {((count / (usageStats.totalUsers || 1)) * 100).toFixed(1)}%
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
              <LanguageIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="body2" color="textSecondary" align="center">
                No language data available
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LanguageDistributionChart; 