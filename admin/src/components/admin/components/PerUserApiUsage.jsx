import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  TableSortLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import UserDailyConsumption from './UserDailyConsumption';

const PerUserApiUsage = ({ userStats }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'total_cost', direction: 'desc' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [dailyConsumptionOpen, setDailyConsumptionOpen] = useState(false);

  const formatCurrency = (amount) => {
    // Convert USD to PHP (using approximate exchange rate)
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

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleViewDailyConsumption = (user) => {
    setSelectedUser(user);
    setDailyConsumptionOpen(true);
  };

  const handleCloseDailyConsumption = () => {
    setDailyConsumptionOpen(false);
    setSelectedUser(null);
  };

  // Filter and sort users
  const filteredAndSortedUsers = userStats
    .filter(user => 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Calculate summary statistics
  const totalUsers = userStats.length;
  const totalCost = userStats.reduce((sum, user) => sum + user.total_cost, 0);
  const totalRequests = userStats.reduce((sum, user) => sum + user.requests, 0);
  const avgCostPerUser = totalCost / (totalUsers || 1);

  return (
    <Box>
      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <PersonIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Active Users</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {formatNumber(totalUsers)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Users with API usage
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: '200px', background: 'linear-gradient(135deg, #FBA834 0%, #50C4ED 100%)', color: 'white' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={1}>
              <TrendingUpIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Avg Cost/User</Typography>
            </Box>
            <Typography variant="h3" fontWeight="bold">
              {formatCurrency(avgCostPerUser)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Average per user
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* User Table */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#387ADF' }}>
              Per-User API Usage
            </Typography>
            <TextField
              size="small"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: '300px' }}
            />
          </Box>

          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Account Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'requests'}
                      direction={sortConfig.key === 'requests' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('requests')}
                    >
                      Requests
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'input_tokens'}
                      direction={sortConfig.key === 'input_tokens' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('input_tokens')}
                    >
                      Input Tokens
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'output_tokens'}
                      direction={sortConfig.key === 'output_tokens' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('output_tokens')}
                    >
                      Output Tokens
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'total_tokens'}
                      direction={sortConfig.key === 'total_tokens' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('total_tokens')}
                    >
                      Total Tokens
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'total_cost'}
                      direction={sortConfig.key === 'total_cost' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('total_cost')}
                    >
                      Total Cost
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    <TableSortLabel
                      active={sortConfig.key === 'avg_cost_per_request'}
                      direction={sortConfig.key === 'avg_cost_per_request' ? sortConfig.direction : 'asc'}
                      onClick={() => handleSort('avg_cost_per_request')}
                    >
                      Avg Cost/Request
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                        No users found matching your search
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.user_id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#387ADF' }}>
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {user.username}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.account_type.toUpperCase()}
                          color={user.account_type === 'premium' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{formatNumber(user.requests)}</TableCell>
                      <TableCell align="right">{formatNumber(user.input_tokens)}</TableCell>
                      <TableCell align="right">{formatNumber(user.output_tokens)}</TableCell>
                      <TableCell align="right">{formatNumber(user.total_tokens)}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="primary">
                          {formatCurrency(user.total_cost)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Average cost per API request">
                          <Typography variant="body2">
                            {formatCurrency(user.avg_cost_per_request)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Daily Consumption">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewDailyConsumption(user)}
                          >
                            <ShowChartIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredAndSortedUsers.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Showing {filteredAndSortedUsers.length} of {totalUsers} users
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Daily Consumption Dialog */}
      <UserDailyConsumption
        open={dailyConsumptionOpen}
        onClose={handleCloseDailyConsumption}
        user={selectedUser}
      />
    </Box>
  );
};

export default PerUserApiUsage;
