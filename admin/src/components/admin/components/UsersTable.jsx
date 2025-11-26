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
  Cancel as CancelIcon,
  AdminPanelSettings as AdminIcon
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
        icon={<CancelIcon />} 
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
        sx={{ bgcolor: '#387ADF' }}
      />
    ) : (
      <Chip 
        label="Free" 
        variant="outlined"
        size="small" 
      />
    );
  };

  const getRoleChip = (user) => {
    return user.isAdmin === true ? (
      <Chip 
        icon={<AdminIcon sx={{ '&&': { fontSize: 16 } }} />}
        label="Admin" 
        color="secondary"
        size="small" 
        sx={{ bgcolor: '#9c27b0', color: 'white', ml: 1 }}
      />
    ) : null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #eee',
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700,
                color: '#333'
              }}
            >
              Users Directory
            </Typography>
            <Chip 
              label={`${filteredUsers.length} users`}
              size="small"
              sx={{
                bgcolor: '#387ADF15',
                color: '#387ADF',
                fontWeight: 600,
                borderRadius: 2
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
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  { key: 'userId', label: 'User ID', icon: <PersonIcon sx={{ fontSize: 16 }} /> },
                  { key: 'accountType', label: 'Type', icon: <StarIcon sx={{ fontSize: 16 }} /> },
                  { key: 'email', label: 'Email', icon: <EmailIcon sx={{ fontSize: 16 }} /> },
                  { key: 'language', label: 'Language', icon: <LanguageIcon sx={{ fontSize: 16 }} /> },
                  { key: 'translator', label: 'Translator', icon: <TranslateIcon sx={{ fontSize: 16 }} /> },
                  { key: 'createdAt', label: 'Created', icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> },
                  { key: 'lastLoginDate', label: 'Last Login', icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> }
                ].map((col) => (
                  <TableCell 
                    key={col.key}
                    sx={{ 
                      fontWeight: 600, 
                      backgroundColor: '#f9fafb', 
                      borderBottom: '1px solid #eee',
                      color: '#555',
                      py: 2
                    }}
                  >
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      sx={{ 
                        cursor: 'pointer', 
                        gap: 1,
                        '&:hover': { color: '#387ADF' } 
                      }}
                      onClick={() => onSort(col.key)}
                    >
                      {col.icon}
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                ))}
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
                    '&:hover': {
                      backgroundColor: '#f8f9fa !important',
                    }
                  }}
                >
                  <TableCell sx={{ color: '#555', fontWeight: 500 }}>
                    {userId}
                    {getRoleChip(user)}
                  </TableCell>
                  <TableCell>
                    {getAccountTypeChip(user.accountType)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2">{user.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.language || 'N/A'} 
                      size="small" 
                      sx={{ bgcolor: '#f0f0f0', borderRadius: 1 }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">{user.translator || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">{formatDate(user.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="textSecondary">{formatDate(user.lastLoginDate)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 0.6 }}>
                      <PersonIcon sx={{ fontSize: 48, mb: 1, color: '#ccc' }} />
                      <Typography variant="body1" color="textSecondary">
                        No users found matching your search
                      </Typography>
                    </Box>
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
