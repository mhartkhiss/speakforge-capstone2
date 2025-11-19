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
  IconButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Star as StarIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  Translate as TranslateIcon,
  AccessTime as AccessTimeIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelCircleIcon
} from '@mui/icons-material';

const UsersTable = ({ 
  users, 
  sortConfig, 
  onSort, 
  onContextMenu,
  filteredUsers 
}) => {
  const getStatusChip = (status) => {
    return status === 'online' ? (
      <Chip 
        icon={<CheckCircleIcon />} 
        label="Online" 
        color="success" 
        size="small" 
      />
    ) : (
      <Chip 
        icon={<CancelCircleIcon />} 
        label="Offline" 
        color="error" 
        size="small" 
      />
    );
  };

  const getAccountTypeChip = (type) => {
    return type === 'premium' ? (
      <Chip 
        label="Premium" 
        color="primary" 
        size="small" 
      />
    ) : (
      <Chip 
        label="Free" 
        color="default" 
        size="small" 
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 8px 32px rgba(56, 122, 223, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
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
              📋 Users Directory
            </Typography>
            <Chip 
              label={`${filteredUsers.length} users found`}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
          <Typography variant="body2" color="textSecondary">
            Manage user accounts, permissions, and view detailed information
          </Typography>
        </Box>

        <TableContainer 
          sx={{ 
            maxHeight: 'calc(100vh - 300px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
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
          <Table size="small" stickyHeader className="enhanced-table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    sx={{ cursor: 'pointer', '&:hover': { color: '#387ADF' } }}
                    onClick={() => onSort('userId')}
                  >
                    <PersonIcon sx={{ mr: 1, fontSize: 18, color: '#387ADF' }} />
                    User ID
                    {sortConfig.key === 'userId' && (
                      sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    sx={{ cursor: 'pointer', '&:hover': { color: '#387ADF' } }}
                    onClick={() => onSort('accountType')}
                  >
                    <StarIcon sx={{ mr: 1, fontSize: 18, color: '#FBA834' }} />
                    Account Type
                    {sortConfig.key === 'accountType' && (
                      sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    sx={{ cursor: 'pointer', '&:hover': { color: '#387ADF' } }}
                    onClick={() => onSort('email')}
                  >
                    <EmailIcon sx={{ mr: 1, fontSize: 18, color: '#387ADF' }} />
                    Email
                    {sortConfig.key === 'email' && (
                      sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    sx={{ cursor: 'pointer', '&:hover': { color: '#387ADF' } }}
                    onClick={() => onSort('language')}
                  >
                    <LanguageIcon sx={{ mr: 1, fontSize: 18, color: '#9c27b0' }} />
                    Language
                    {sortConfig.key === 'language' && (
                      sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    sx={{ cursor: 'pointer', '&:hover': { color: '#387ADF' } }}
                    onClick={() => onSort('translator')}
                  >
                    <TranslateIcon sx={{ mr: 1, fontSize: 18, color: '#ff9800' }} />
                    Translator
                    {sortConfig.key === 'translator' && (
                      sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    sx={{ cursor: 'pointer', '&:hover': { color: '#387ADF' } }}
                    onClick={() => onSort('createdAt')}
                  >
                    <AccessTimeIcon sx={{ mr: 1, fontSize: 18, color: '#607d8b' }} />
                    Created At
                    {sortConfig.key === 'createdAt' && (
                      sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    sx={{ cursor: 'pointer', '&:hover': { color: '#387ADF' } }}
                    onClick={() => onSort('lastLoginDate')}
                  >
                    <AccessTimeIcon sx={{ mr: 1, fontSize: 18, color: '#607d8b' }} />
                    Last Login
                    {sortConfig.key === 'lastLoginDate' && (
                      sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" sx={{ ml: 0.5 }} /> : <ArrowDownwardIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map(([userId, user]) => (
                <TableRow 
                  key={userId} 
                  hover
                  onContextMenu={(e) => onContextMenu(e, userId, user)}
                  sx={{ 
                    cursor: 'context-menu',
                    transition: 'all 0.2s ease',
                    '&:nth-of-type(odd)': {
                      backgroundColor: '#fafafa'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(56, 122, 223, 0.08)',
                      transform: 'translateX(4px)',
                      boxShadow: '0 2px 8px rgba(56, 122, 223, 0.15)',
                    }
                  }}
                >
                  <TableCell>{userId}</TableCell>
                  <TableCell>
                    {getAccountTypeChip(user.accountType)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {user.email}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <LanguageIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {user.language}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <TranslateIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {user.translator}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {formatDate(user.createdAt)}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      {formatDate(user.lastLoginDate)}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                      No users found matching your search
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default UsersTable; 