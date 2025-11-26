import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';
// Removed CSS import
import { loadApiBaseUrl } from '../../config';

// Import all the new components
import AppHeader from './components/AppHeader';
import SideDrawer from './components/SideDrawer';
import UsersControlBar from './components/UsersControlBar';
import UsersTable from './components/UsersTable';
import StatisticsControlBar from './components/StatisticsControlBar';
import StatisticsCards from './components/StatisticsCards';
import TimePeriodSelector from './components/TimePeriodSelector';
import LoginTrendChart from './components/LoginTrendChart';
import AccountTypeChart from './components/AccountTypeChart';
import LanguageDistributionChart from './components/LanguageDistributionChart';
import DailyActivityTable from './components/DailyActivityTable';
import TopUsersLeaderboard from './components/TopUsersLeaderboard';
import ApiUsageStatistics from './components/ApiUsageStatistics';
import SettingsTab from './components/SettingsTab';
import FirebaseStructureTab from './components/FirebaseStructureTab';
import SurveyTab from './components/SurveyTab';
import UserDialogs from './components/UserDialogs';
import UserContextMenu from './components/UserContextMenu';
import NotificationSnackbar from './components/NotificationSnackbar';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
);

// Helper component for common container styles
const TabContentContainer = ({ children }) => (
  <Box 
    sx={{ 
      p: 0, 
      height: 'calc(100vh - 150px)', 
      overflow: 'auto',
      pr: 1,
      '&::-webkit-scrollbar': {
        width: '8px',
      },
      '&::-webkit-scrollbar-track': {
        background: '#f1f1f1',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb': {
        background: '#c1c1c1',
        borderRadius: '4px',
        '&:hover': {
          background: '#a8a8a8',
        },
      },
    }}
  >
    {children}
    <Box sx={{ height: '40px' }} />
  </Box>
);

const AdminDashboard = () => {
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [newUser, setNewUser] = useState({
    email: '',
    password: ''
  });
  const [contextMenu, setContextMenu] = useState({
    open: false,
    mouseX: null,
    mouseY: null,
    userId: null,
    user: null
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState('');
  const [usageStatsLoading, setUsageStatsLoading] = useState(false);
  const [usageStats, setUsageStats] = useState({
    totalUsers: 0,
    activeUsersLast7Days: 0,
    premiumUsers: 0,
    freeUsers: 0,
    languageDistribution: {},
    dailyLoginUsage: []
  });
  const [apiUsageStats, setApiUsageStats] = useState(null);
  const [apiUsageStatsLoading, setApiUsageStatsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('users');
  const [chartType, setChartType] = useState('line');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Brand Colors
  const colors = {
    primary: '#387ADF',
    secondary: '#50C4ED',
    accent: '#FBA834',
    background: '#F9FAFB'
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          navigate('/admin/login');
          return;
        }

        const baseUrl = await loadApiBaseUrl();
        const response = await fetch(`${baseUrl}/admin/users/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data || {});
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
        setSnackbar({
          open: true,
          message: 'Error fetching users: ' + error.message,
          severity: 'error'
        });
      }
    };

    fetchUsers();
  }, [navigate]);

  // Fetch admin email from Firebase auth
  useEffect(() => {
    const fetchAdminEmail = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.email) {
          setAdminEmail(currentUser.email);
        }
      } catch (error) {
        console.error('Error fetching admin email:', error);
      }
    };

    fetchAdminEmail();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();
      await fetch(`${baseUrl}/admin/logout/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      // Clear the token and redirect to login
      localStorage.removeItem('adminToken');
      navigate('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setSnackbar({
        open: true,
        message: 'Error logging out: ' + error.message,
        severity: 'error'
      });
    }
  };

  // Handler functions
  const handleMenuToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleTabChange = (newTab) => {
    setCurrentTab(newTab);
    if (newTab === 'statistics') {
      handleShowUsageStats();
    } else if (newTab === 'api-usage') {
      handleShowApiUsageStats();
    }
  };

  const handleEdit = (userId, user) => {
    setSelectedUser({ userId, user });
    setSelectedAccountType(user.accountType || 'free');
    setEditModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const baseUrl = await loadApiBaseUrl();
        const response = await fetch(`${baseUrl}/admin/users/${userId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }

        // Refresh the users list
        const usersResponse = await fetch(`${baseUrl}/admin/users/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        const usersData = await usersResponse.json();
        setUsers(usersData || {});
        setSnackbar({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        setSnackbar({
          open: true,
          message: 'Error deleting user: ' + error.message,
          severity: 'error'
        });
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();
      const response = await fetch(`${baseUrl}/admin/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      // Refresh the users list
      await refreshUsers();
      
      // Reset form and hide it
      setNewUser({ email: '', password: '' });
      setShowAddUser(false);
      setSnackbar({
        open: true,
        message: 'User created successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating user:', error);
      setSnackbar({
        open: true,
        message: 'Error creating user: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleContextMenu = (event, userId, user) => {
    event.preventDefault();
    setContextMenu({
      open: true,
      mouseX: event.clientX,
      mouseY: event.clientY,
      userId,
      user
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({
      open: false,
      mouseX: null,
      mouseY: null,
      userId: null,
      user: null
    });
  };

  const handleResetPassword = async (email) => {
    if (!email) {
      setSnackbar({
        open: true,
        message: 'Cannot reset password, email is missing for this user.',
        severity: 'error'
      });
      return;
    }
    
    if (!window.confirm(`Are you sure you want to send a password reset email to ${email}?`)) {
        return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      setSnackbar({
        open: true,
        message: `Password reset email sent successfully to ${email}.`, 
        severity: 'success'
      });

    } catch (error) {
      console.error('Error sending password reset email:', error);
      setSnackbar({
        open: true,
        message: `Error sending password reset email: ${error.message || error}`, 
        severity: 'error'
      });
    }
  };

  const handleToggleAdmin = async (userId, isAdmin) => {
    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();
      const response = await fetch(`${baseUrl}/admin/users/${userId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          isAdmin: isAdmin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }

      // Refresh the users list
      await refreshUsers();
      
      setSnackbar({
        open: true,
        message: `User role updated to ${isAdmin ? 'Admin' : 'Standard User'} successfully`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user role: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleAccountTypeChange = async (event) => {
    const newAccountType = event.target.value;
    setSelectedAccountType(newAccountType);

    try {
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();
      const response = await fetch(`${baseUrl}/admin/users/${selectedUser.userId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          ...selectedUser.user,
          accountType: newAccountType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      // Refresh the users list
      await refreshUsers();
      
      setSnackbar({
        open: true,
        message: 'User account type updated successfully',
        severity: 'success'
      });

      // Auto-close the modal after successful update
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({
        open: true,
        message: 'Error updating user: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
    setSelectedAccountType('');
  };

  const handleShowUsageStats = async (period = selectedPeriod) => {
    try {
      setUsageStatsLoading(true);
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();
      const response = await fetch(`${baseUrl}/admin/usage/?period=${period}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage statistics');
      }

      const data = await response.json();
      setUsageStats(data);
      setSnackbar({
        open: true,
        message: 'Usage statistics updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error fetching usage statistics:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching usage statistics: ' + error.message,
        severity: 'error'
      });
    } finally {
      setUsageStatsLoading(false);
    }
  };

  const handleShowApiUsageStats = async (period = selectedPeriod) => {
    try {
      setApiUsageStatsLoading(true);
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();
      const response = await fetch(`${baseUrl}/admin/api-usage/?period=${period}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API usage statistics');
      }

      const data = await response.json();
      setApiUsageStats(data);
      setSnackbar({
        open: true,
        message: 'API usage statistics updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error fetching API usage statistics:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching API usage statistics: ' + error.message,
        severity: 'error'
      });
    } finally {
      setApiUsageStatsLoading(false);
    }
  };

  // Export API usage statistics to CSV
  const exportApiUsageToCSV = () => {
    if (!apiUsageStats) return;

    const csvData = [];

    // Overall statistics
    csvData.push(['API Usage Statistics']);
    csvData.push(['Period', apiUsageStats.period]);
    csvData.push(['Date Range', `${apiUsageStats.start_date} to ${apiUsageStats.end_date}`]);
    csvData.push(['']);

    // Overall stats
    csvData.push(['Overall Statistics']);
    csvData.push(['Total Requests', apiUsageStats.overall_stats.total_requests]);
    csvData.push(['Total Tokens', apiUsageStats.overall_stats.total_tokens]);
    csvData.push(['Total Cost ($)', apiUsageStats.overall_stats.total_cost]);
    csvData.push(['Avg Tokens per Request', apiUsageStats.overall_stats.avg_tokens_per_request]);
    csvData.push(['Avg Cost per Request ($)', apiUsageStats.overall_stats.avg_cost_per_request]);
    csvData.push(['']);

    // Model breakdown
    csvData.push(['Model Breakdown']);
    csvData.push(['Model', 'Requests', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Input Cost ($)', 'Output Cost ($)', 'Total Cost ($)']);
    apiUsageStats.model_breakdown.forEach(model => {
      csvData.push([
        model.model,
        model.requests,
        model.input_tokens,
        model.output_tokens,
        model.total_tokens,
        model.input_cost,
        model.output_cost,
        model.total_cost
      ]);
    });
    csvData.push(['']);

    // Pricing information
    csvData.push(['Pricing Information (per million tokens)']);
    csvData.push(['Model', 'Input Price ($)', 'Output Price ($)']);
    csvData.push(['Claude 3.5 Sonnet', apiUsageStats.pricing_info.claude_3_5_sonnet.input_price_per_million, apiUsageStats.pricing_info.claude_3_5_sonnet.output_price_per_million]);
    csvData.push(['Gemini 2.5 Flash', apiUsageStats.pricing_info.gemini_2_5_flash.input_price_per_million, apiUsageStats.pricing_info.gemini_2_5_flash.output_price_per_million]);
    csvData.push(['']);

    // Daily usage (last 30 days or available data)
    if (apiUsageStats.daily_stats && apiUsageStats.daily_stats.length > 0) {
      csvData.push(['Daily Usage Summary']);
      csvData.push(['Date', 'Requests', 'Tokens', 'Cost ($)']);
      apiUsageStats.daily_stats.slice(-30).forEach(day => {
        csvData.push([
          day.date,
          day.total_requests,
          day.total_tokens,
          day.total_cost
        ]);
      });
    }
    csvData.push(['']);

    // Per-user usage statistics
    if (apiUsageStats.user_stats && apiUsageStats.user_stats.length > 0) {
      csvData.push(['Per-User API Usage Summary']);
      csvData.push(['User ID', 'Email', 'Username', 'Account Type', 'Requests', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Total Cost ($)', 'Avg Cost per Request ($)']);
      apiUsageStats.user_stats.forEach(user => {
        csvData.push([
          user.user_id,
          user.email,
          user.username,
          user.account_type,
          user.requests,
          user.input_tokens,
          user.output_tokens,
          user.total_tokens,
          user.total_cost,
          user.avg_cost_per_request
        ]);
      });
      csvData.push(['']);

      // Per-user daily consumption
      csvData.push(['Per-User Daily Consumption']);
      apiUsageStats.user_stats.forEach(user => {
        if (user.daily_usage && user.daily_usage.length > 0) {
          csvData.push(['']);
          csvData.push([`User: ${user.username} (${user.email})`]);
          csvData.push(['Date', 'Requests', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Cost ($)']);
          user.daily_usage.forEach(day => {
            csvData.push([
              day.date,
              day.requests,
              day.input_tokens,
              day.output_tokens,
              day.total_tokens,
              day.total_cost
            ]);
          });
        }
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-usage-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Refresh users function
  const refreshUsers = async () => {
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();
      const response = await fetch(`${baseUrl}/admin/users/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data || {});
      setSnackbar({
        open: true,
        message: 'Users list refreshed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing users:', error);
      setSnackbar({
        open: true,
        message: 'Error refreshing users: ' + error.message,
        severity: 'error'
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Utility functions
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const handleViewDetails = (day) => {
    setSelectedDay(day);
    setShowUserDetails(true);
  };

  const handlePeriodChange = async (newPeriod) => {
    setSelectedPeriod(newPeriod);
    if (currentTab === 'statistics') {
      await handleShowUsageStats(newPeriod);
    } else if (currentTab === 'api-usage') {
      await handleShowApiUsageStats(newPeriod);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && (currentTab === 'statistics' || currentTab === 'api-usage')) {
      const interval = setInterval(() => {
        if (currentTab === 'statistics') {
          handleShowUsageStats();
        } else if (currentTab === 'api-usage') {
          handleShowApiUsageStats();
        }
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
      return () => clearInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [autoRefresh, currentTab]);

  // Export functionality
  const exportToCSV = () => {
    const csvData = [];
    csvData.push(['Metric', 'Value']);
    csvData.push(['Total Users', usageStats.totalUsers]);
    csvData.push(['Active Users (Last 7 Days)', usageStats.activeUsersLast7Days]);
    csvData.push(['Premium Users', usageStats.premiumUsers]);
    csvData.push(['Free Users', usageStats.freeUsers]);
    csvData.push(['']);
    csvData.push(['Daily Login Usage']);
    csvData.push(['Date', 'Count']);
    
    if (usageStats.dailyLoginUsage) {
      usageStats.dailyLoginUsage.forEach(day => {
        csvData.push([day.date, day.count]);
      });
    }

    csvData.push(['']);
    csvData.push(['Language Distribution']);
    csvData.push(['Language', 'Users', 'Percentage']);
    
    if (usageStats.languageDistribution) {
      Object.entries(usageStats.languageDistribution).forEach(([language, count]) => {
        const percentage = ((count / (usageStats.totalUsers || 1)) * 100).toFixed(1);
        csvData.push([language, count, `${percentage}%`]);
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter and sort users
  const filteredUsers = Object.entries(users)
    .filter(([_, user]) => 
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      const aValue = a[1][sortConfig.key] || '';
      const bValue = b[1][sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        bgcolor: colors.background
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: colors.primary }} />
        <Typography variant="h6" mt={2} sx={{ color: '#666' }}>Loading users data...</Typography>
      </Box>
    );
  }


  if (!users || Object.keys(users).length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        bgcolor: colors.background
      }}>
        <Typography variant="h5" gutterBottom>No users found</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setShowAddUser(true)}
          sx={{ bgcolor: colors.primary, '&:hover': { bgcolor: '#2c62b5' } }}
        >
          Add New User
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      bgcolor: colors.background
    }}>
      <AppHeader
        onMenuToggle={handleMenuToggle}
        onLogout={handleLogout}
        adminEmail={adminEmail}
      />

      <SideDrawer 
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentTab={currentTab}
        onTabChange={handleTabChange}
      />

      <Box component="main" sx={{
        flexGrow: 1,
        px: { xs: 1, md: 3 },
        pb: { xs: 1, md: 3 },
        width: '100%',
        height: '100vh',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        pt: '100px',
        boxSizing: 'border-box'
      }}>
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {/* Users Tab Content */}
          {currentTab === 'users' && (
            <TabContentContainer>
              <UsersControlBar 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClearSearch={clearSearch}
                onRefresh={refreshUsers}
                onAddUser={() => setShowAddUser(true)}
                isRefreshing={usersLoading}
              />

              <UsersTable 
                users={users}
                sortConfig={sortConfig}
                onSort={handleSort}
                onContextMenu={handleContextMenu}
                filteredUsers={filteredUsers}
              />
            </TabContentContainer>
          )}

          {/* Statistics Tab Content */}
          {currentTab === 'statistics' && (
            <TabContentContainer>
              <StatisticsControlBar 
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
                onRefresh={handleShowUsageStats}
                onExport={exportToCSV}
                isLoading={usageStatsLoading}
                usageStats={usageStats}
              />

              <StatisticsCards usageStats={usageStats} selectedPeriod={selectedPeriod} />

              <TimePeriodSelector 
                selectedPeriod={selectedPeriod}
                onPeriodChange={handlePeriodChange}
                isLoading={usageStatsLoading}
              />

               {/* Enhanced Charts and Tables Section */}
               <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
                 {/* Main Login Trend Chart */}
                 <Grid item xs={12} lg={8}>
                   <LoginTrendChart 
                     usageStats={usageStats}
                     chartType={chartType}
                     onChartTypeChange={setChartType}
                     selectedPeriod={selectedPeriod}
                     isLoading={usageStatsLoading}
                   />
                 </Grid>

                 {/* Account Type Distribution */}
                 <Grid item xs={12} lg={4}>
                   <AccountTypeChart usageStats={usageStats} />
                 </Grid>

                 {/* Language Distribution Chart */}
                 <Grid item xs={12} md={6}>
                   <LanguageDistributionChart usageStats={usageStats} />
                 </Grid>

                 {/* Enhanced User Login Activity Table */}
                 <Grid item xs={12} md={6}>
                   <DailyActivityTable 
                     usageStats={usageStats}
                     onViewDetails={handleViewDetails}
                   />
                 </Grid>

                 {/* Enhanced Top Users Leaderboard */}
                 <Grid item xs={12}>
                   <TopUsersLeaderboard usageStats={usageStats} />
                 </Grid>
               </Grid>
             </TabContentContainer>
           )}

          {/* API Usage Tab Content */}
          {currentTab === 'api-usage' && (
            <TabContentContainer>
              <StatisticsControlBar
                autoRefresh={autoRefresh}
                onAutoRefreshChange={setAutoRefresh}
                onRefresh={handleShowApiUsageStats}
                onExport={exportApiUsageToCSV}
                isLoading={apiUsageStatsLoading}
                usageStats={apiUsageStats}
              />

              <ApiUsageStatistics
                selectedPeriod={selectedPeriod}
                onPeriodChange={handlePeriodChange}
                isLoading={apiUsageStatsLoading}
                apiStats={apiUsageStats}
              />
            </TabContentContainer>
          )}

          {/* Survey Tab Content */}
          {currentTab === 'survey' && (
            <TabContentContainer>
              <SurveyTab />
            </TabContentContainer>
          )}

          {/* Settings Tab Content */}
          {currentTab === 'settings' && (
            <TabContentContainer>
              <SettingsTab />
            </TabContentContainer>
          )}

          {/* Database Tab Content */}
          {currentTab === 'database' && (
            <TabContentContainer>
              <FirebaseStructureTab />
            </TabContentContainer>
          )}
        </Box>
      </Box>

      <UserDialogs 
        showAddUser={showAddUser}
        onCloseAddUser={() => setShowAddUser(false)}
        newUser={newUser}
        onNewUserChange={setNewUser}
        onAddUser={handleAddUser}
        editModalOpen={editModalOpen}
        onCloseEditModal={handleCloseEditModal}
        selectedAccountType={selectedAccountType}
        onAccountTypeChange={handleAccountTypeChange}
        showUserDetails={showUserDetails}
        onCloseUserDetails={() => setShowUserDetails(false)}
        selectedDay={selectedDay}
      />

      <UserContextMenu 
        contextMenu={contextMenu}
        onClose={handleCloseContextMenu}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onResetPassword={handleResetPassword}
        onToggleAdmin={handleToggleAdmin}
      />

      <NotificationSnackbar 
        snackbar={snackbar}
        onClose={handleCloseSnackbar}
      />
    </Box>
  );
};

export default AdminDashboard;
