import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';

const UserDailyConsumption = ({ open, onClose, user }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!user) return null;

  const formatCurrency = (amount) => {
    const usdToPhpRate = 58.10;
    const amountInPhp = amount * usdToPhpRate;

    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 5
    }).format(amountInPhp);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Prepare chart data
  const dailyUsage = user.daily_usage || [];
  const chartData = {
    labels: dailyUsage.map(day => new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Requests',
        data: dailyUsage.map(day => day.requests),
        borderColor: '#387ADF',
        backgroundColor: 'rgba(56, 122, 223, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'Total Tokens',
        data: dailyUsage.map(day => day.total_tokens),
        borderColor: '#FBA834',
        backgroundColor: 'rgba(251, 168, 52, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const costChartData = {
    labels: dailyUsage.map(day => new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Cost (PHP)',
        data: dailyUsage.map(day => day.total_cost * 58.10),
        borderColor: '#50C4ED',
        backgroundColor: 'rgba(80, 196, 237, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily API Usage Trend'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatNumber(context.parsed.y);
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Requests'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Tokens'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    }
  };

  const costChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Cost Trend'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return 'Cost: ' + formatCurrency(context.parsed.y / 58.10);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cost (PHP)'
        },
        ticks: {
          callback: function(value) {
            return '₱' + formatNumber(value);
          }
        }
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              Daily API Consumption - {user.username}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {user.email}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {dailyUsage.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TrendingUpIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No daily usage data available
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This user hasn't made any API requests in the selected period.
            </Typography>
          </Box>
        ) : (
          <>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
              <Tab label="Usage Chart" />
              <Tab label="Cost Chart" />
              <Tab label="Data Table" />
            </Tabs>

            {activeTab === 0 && (
              <Box sx={{ height: '400px', mb: 3 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ height: '400px', mb: 3 }}>
                <Line data={costChartData} options={costChartOptions} />
              </Box>
            )}

            {activeTab === 2 && (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Requests</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Input Tokens</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Output Tokens</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Tokens</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dailyUsage.map((day) => (
                      <TableRow key={day.date} hover>
                        <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{formatNumber(day.requests)}</TableCell>
                        <TableCell align="right">{formatNumber(day.input_tokens)}</TableCell>
                        <TableCell align="right">{formatNumber(day.output_tokens)}</TableCell>
                        <TableCell align="right">{formatNumber(day.total_tokens)}</TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="primary">
                            {formatCurrency(day.total_cost)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(dailyUsage.reduce((sum, day) => sum + day.requests, 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(dailyUsage.reduce((sum, day) => sum + day.input_tokens, 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(dailyUsage.reduce((sum, day) => sum + day.output_tokens, 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatNumber(dailyUsage.reduce((sum, day) => sum + day.total_tokens, 0))}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        <Typography fontWeight="bold" color="primary">
                          {formatCurrency(dailyUsage.reduce((sum, day) => sum + day.total_cost, 0))}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Summary Statistics */}
            <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                Period Summary
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">Total Days</Typography>
                  <Typography variant="body1" fontWeight="bold">{dailyUsage.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Avg Requests/Day</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatNumber(Math.round(dailyUsage.reduce((sum, day) => sum + day.requests, 0) / dailyUsage.length))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Avg Tokens/Day</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatNumber(Math.round(dailyUsage.reduce((sum, day) => sum + day.total_tokens, 0) / dailyUsage.length))}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">Avg Cost/Day</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(dailyUsage.reduce((sum, day) => sum + day.total_cost, 0) / dailyUsage.length)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDailyConsumption;
