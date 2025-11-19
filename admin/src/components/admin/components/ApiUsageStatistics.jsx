import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  MonetizationOn as MonetizationOnIcon,
  Functions as FunctionsIcon,
  TrendingUp as TrendingUpIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import PerUserApiUsage from './PerUserApiUsage';

const ApiUsageStatistics = ({ selectedPeriod, onPeriodChange, isLoading, apiStats }) => {
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => {
    // Convert USD to PHP (using approximate exchange rate of 56.5 PHP per USD)
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

  if (isLoading || !apiStats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading API usage statistics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading API usage statistics: {error}
      </Alert>
    );
  }

  const { overall_stats, model_breakdown, daily_stats, pricing_info } = apiStats;

  // Calculate cost breakdown percentages
  const claudeStats = model_breakdown.find(m => m.model === 'claude');
  const geminiStats = model_breakdown.find(m => m.model === 'gemini');

  return (
    <Box>
      {/* Overall Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ApiIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Requests</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {formatNumber(overall_stats.total_requests)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                API calls in period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #FBA834 0%, #50C4ED 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <FunctionsIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Tokens</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {formatNumber(overall_stats.total_tokens)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Input + Output tokens
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #50C4ED 0%, #387ADF 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <MonetizationOnIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Total Cost</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {formatCurrency(overall_stats.total_cost)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Claude + Gemini costs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #387ADF 0%, #FBA834 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Avg Cost/Request</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {formatCurrency(overall_stats.avg_cost_per_request)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Average per API call
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Model Breakdown Table */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#387ADF' }}>
            Model Usage Breakdown
          </Typography>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Model</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Requests</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Input Tokens</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Output Tokens</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Tokens</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Input Cost</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Output Cost</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {model_breakdown.map((model) => (
                  <TableRow key={model.model} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Chip
                          label={model.model.toUpperCase()}
                          color={model.model === 'claude' ? 'primary' : 'secondary'}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatNumber(model.requests)}</TableCell>
                    <TableCell align="right">{formatNumber(model.input_tokens)}</TableCell>
                    <TableCell align="right">{formatNumber(model.output_tokens)}</TableCell>
                    <TableCell align="right">{formatNumber(model.total_tokens)}</TableCell>
                    <TableCell align="right">{formatCurrency(model.input_cost)}</TableCell>
                    <TableCell align="right">{formatCurrency(model.output_cost)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        {formatCurrency(model.total_cost)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Pricing Information */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#387ADF' }}>
            Current Pricing (per million tokens)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" color="primary" gutterBottom>
                  Claude 3.5 Sonnet
                </Typography>
                <Typography variant="body1">
                  Input: {formatCurrency(pricing_info.claude_3_5_sonnet.input_price_per_million)}
                </Typography>
                <Typography variant="body1">
                  Output: {formatCurrency(pricing_info.claude_3_5_sonnet.output_price_per_million)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Typography variant="h6" color="secondary" gutterBottom>
                  Gemini 2.5 Flash
                </Typography>
                <Typography variant="body1">
                  Input: {formatCurrency(pricing_info.gemini_2_5_flash.input_price_per_million)}
                </Typography>
                <Typography variant="body1">
                  Output: {formatCurrency(pricing_info.gemini_2_5_flash.output_price_per_million)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Daily Usage Summary */}
      {daily_stats && daily_stats.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#387ADF' }}>
              Daily Usage Summary
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Requests</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Tokens</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {daily_stats.slice(-14).map((day) => ( // Show last 14 days
                    <TableRow key={day.date} hover>
                      <TableCell>{new Date(day.date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{formatNumber(day.total_requests)}</TableCell>
                      <TableCell align="right">{formatNumber(day.total_tokens)}</TableCell>
                      <TableCell align="right">{formatCurrency(day.total_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-User API Usage */}
      {apiStats.user_stats && apiStats.user_stats.length > 0 ? (
        <PerUserApiUsage userStats={apiStats.user_stats} />
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#387ADF' }}>
              Per-User API Usage
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                No per-user API usage data available for the selected period.
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                User-specific API usage will appear here once translation requests are made with user IDs.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ApiUsageStatistics;
