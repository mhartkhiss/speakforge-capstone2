import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Collapse,
  Tabs,
  Tab
} from '@mui/material';
import {
  Folder as FolderIcon,
  TableChart as TableIcon,
  DataObject as DataIcon,
  Schema as SchemaIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { getDatabase, ref, get, query, orderByChild, limitToLast } from 'firebase/database';

// Firebase database structure data
const firebaseStructure = {
  tables: [
    {
      name: 'users',
      icon: '👥',
      description: 'Stores information about registered users',
      fields: [
        { name: 'userId', type: 'String', description: 'Unique identifier for the user (Firebase Auth UID)' },
        { name: 'username', type: 'String', description: 'Display name of the user' },
        { name: 'email', type: 'String', description: 'User\'s email address' },
        { name: 'profileImageUrl', type: 'String', description: 'URL to the user\'s profile image (stored in Firebase Storage)' },
        { name: 'language', type: 'String', description: 'User\'s preferred language (optional, set when user first logs in)' },
        { name: 'accountType', type: 'String', description: 'Type of user account (e.g., free, premium)' },
        { name: 'createdAt', type: 'String', description: 'Timestamp of account creation' },
        { name: 'lastLoginDate', type: 'String', description: 'Timestamp of the last login (optional, set when user first logs in)' },
        { name: 'translator', type: 'String', description: 'Preferred translation service (default: "google")' },
        { name: 'lastMessage', type: 'String', description: 'Last message sent by the user' },
        { name: 'lastMessageTime', type: 'Long', description: 'Timestamp of the last message' },
        { name: 'contactsettings', type: 'Object', description: 'Contains per-contact preferences and settings' }
      ]
    },
    {
      name: 'connect_chats',
      icon: '🎙️',
      description: 'Voice-only conversation sessions',
      fields: [
        { name: 'messageId', type: 'String', description: 'Unique identifier for each message' },
        { name: 'message', type: 'String', description: 'Transcribed voice message' },
        { name: 'timestamp', type: 'Long', description: 'When the message was sent' },
        { name: 'senderId', type: 'String', description: 'User ID of the message sender' },
        { name: 'senderLanguage', type: 'String', description: 'The language of the sender' },
        { name: 'translationMode', type: 'String', description: 'Formal or casual translation style' },
        { name: 'translationState', type: 'String', description: 'Current state of message translation' },
        { name: 'isVoiceMessage', type: 'Boolean', description: 'Always true for connect chat messages' },
        { name: 'voiceText', type: 'String', description: 'Transcribed voice text' },
        { name: 'isSessionEnd', type: 'Boolean', description: 'True if this is a session end message' },
        { name: 'replyToMessageId', type: 'String', description: 'ID of the message this is replying to' },
        { name: 'replyToSenderId', type: 'String', description: 'ID of the sender of the original message' },
        { name: 'replyToMessage', type: 'String', description: 'Content of the original message' },
        { name: 'translations', type: 'Object', description: 'Map of translations for the message' }
      ]
    },
    {
      name: 'connection_requests',
      icon: '🤝',
      description: 'Connect chat session requests between users',
      fields: [
        { name: 'requestId', type: 'String', description: 'Unique request identifier' },
        { name: 'fromUserId', type: 'String', description: 'User who initiated the request' },
        { name: 'toUserId', type: 'String', description: 'User who should receive the request' },
        { name: 'sessionId', type: 'String', description: 'Proposed connect chat session ID' },
        { name: 'status', type: 'String', description: 'PENDING, ACCEPTED, REJECTED, TIMEOUT, EXPIRED, CANCELLED' },
        { name: 'timestamp', type: 'Long', description: 'When request was created' },
        { name: 'fromUserName', type: 'String', description: 'Name of the requesting user' },
        { name: 'fromUserLanguage', type: 'String', description: 'Language of the requesting user' },
        { name: 'fromUserProfileImageUrl', type: 'String', description: 'Profile image URL of the requesting user' },
        { name: 'expiresAt', type: 'Long', description: 'When request expires' }
      ]
    },
    {
      name: 'usage_statistics',
      icon: '📊',
      description: 'Daily snapshots of application usage metrics',
      fields: [
        { name: 'date', type: 'String', description: 'Date in YYYY-MM-DD format (used as the key)' },
        { name: 'totalUsers', type: 'Number', description: 'Total number of registered users on this date' },
        { name: 'activeUsersLast7Days', type: 'Number', description: 'Number of unique users who logged in during the 7 days ending on this date' },
        { name: 'premiumUsers', type: 'Number', description: 'Number of users with premium accounts on this date' },
        { name: 'freeUsers', type: 'Number', description: 'Number of users with free accounts on this date' },
        { name: 'newUsersToday', type: 'Number', description: 'Number of new user registrations on this specific date' },
        { name: 'dailyLoginCount', type: 'Number', description: 'Number of unique users who logged in on this specific date' },
        { name: 'languageDistribution', type: 'Object', description: 'Object containing the count of users by preferred language' },
        { name: 'createdAt', type: 'String', description: 'ISO timestamp when this record was first created' },
        { name: 'calculatedAt', type: 'String', description: 'ISO timestamp when these statistics were last calculated/updated' }
      ]
    },
    {
      name: 'settings',
      icon: '⚙️',
      description: 'Application-wide configuration settings',
      fields: [
        { name: 'backendUrl', type: 'String', description: 'API base URL for mobile app backend communication' },
        { name: 'apkDownloadUrl', type: 'String', description: 'URL for APK download and QR codes' },
        { name: 'updatedAt', type: 'String', description: 'ISO timestamp when settings were last updated' },
        { name: 'updatedBy', type: 'String', description: 'Identifier of who last updated the settings' }
      ]
    }
  ]
};

const FirebaseStructureTab = () => {
  const [selectedTable, setSelectedTable] = useState(firebaseStructure.tables[0]);
  const [realData, setRealData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('tables');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const db = getDatabase();

      const dataPromises = firebaseStructure.tables.map(async (table) => {
        try {
          const tableRef = ref(db, table.name);

          // Get count and recent data
          const snapshot = await get(tableRef);
          let count = 0;
          let recentEntries = [];

          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && typeof data === 'object') {
              count = Object.keys(data).length;

              // Get recent entries (last 3)
              const entries = Object.entries(data)
                .sort(([a], [b]) => b.localeCompare(a)) // Sort by key descending
                .slice(0, 3);

              recentEntries = entries.map(([key, value]) => ({
                id: key,
                data: value
              }));
            }
          }

          return {
            tableName: table.name,
            count,
            recentEntries,
            lastUpdated: new Date().toISOString()
          };
        } catch (err) {
          console.error(`Error fetching data for ${table.name}:`, err);
          return {
            tableName: table.name,
            count: 0,
            recentEntries: [],
            error: err.message,
            lastUpdated: new Date().toISOString()
          };
        }
      });

      const results = await Promise.all(dataPromises);
      const dataMap = {};
      results.forEach(result => {
        dataMap[result.tableName] = result;
      });

      setRealData(dataMap);
    } catch (err) {
      console.error('Error fetching Firebase data:', err);
      setError('Failed to load Firebase data: ' + err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const toggleExpandedRow = (tableName, rowId) => {
    setExpandedRows(prev => ({
      ...prev,
      [`${tableName}-${rowId}`]: !prev[`${tableName}-${rowId}`]
    }));
  };

  const getTypeColor = (type) => {
    const colors = {
      'String': '#4caf50',
      'Long': '#2196f3',
      'Boolean': '#ff9800',
      'Number': '#9c27b0',
      'Object': '#f44336'
    };
    return colors[type] || '#666';
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return 'null';

    switch (type) {
      case 'String':
        return typeof value === 'string' ? `"${value}"` : String(value);
      case 'Long':
      case 'Number':
        return typeof value === 'number' ? value : String(value);
      case 'Boolean':
        return typeof value === 'boolean' ? value.toString() : String(value);
      case 'Object':
        return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      default:
        return String(value);
    }
  };

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: '#333',
                mb: 1,
                fontSize: '2rem'
              }}
            >
              🗄️ Firebase Database
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Live data explorer and schema reference
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={refreshData}
            disabled={refreshing || loading}
            size="small"
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              borderColor: '#387ADF',
              color: '#387ADF',
              '&:hover': {
                borderColor: '#2E6BCF',
                backgroundColor: '#f0f7ff'
              },
              '&:disabled': {
                borderColor: '#ccc',
                color: '#ccc'
              }
            }}
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 1 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ color: '#666' }}>
              Loading Firebase data...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', px: 3, pb: 3 }}>
        {/* Internal Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                minHeight: 48,
                '&.Mui-selected': {
                  color: '#387ADF'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#387ADF',
                height: 3,
                borderRadius: 2
              }
            }}
          >
            <Tab
              label="📊 Tables Explorer"
              value="tables"
            />
            <Tab
              label="🔗 Relationships Explorer"
              value="relationships"
            />
          </Tabs>
        </Box>

        {/* Tab Content Container */}
        <>
          {/* Tables Explorer Tab */}
          {activeTab === 'tables' && (
            <Box sx={{ flex: 1, display: 'flex', gap: 3 }}>
              {/* Sidebar */}
              <Box sx={{ width: 320, flexShrink: 0 }}>
                <Paper
                  elevation={2}
                  sx={{
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: 'fit-content',
                    maxHeight: 'calc(100vh - 350px)',
                    overflowY: 'auto'
                  }}
                >
                  <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                      📋 Tables ({firebaseStructure.tables.length})
                    </Typography>
                  </Box>

                  <List sx={{ py: 1 }}>
                    {firebaseStructure.tables.map((table, index) => {
                      const tableData = realData[table.name];
                      const recordCount = tableData?.count || 0;
                      const hasError = tableData?.error;

                      return (
                        <ListItem
                          key={table.name}
                          button
                          selected={selectedTable.name === table.name}
                          onClick={() => setSelectedTable(table)}
                          sx={{
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                              backgroundColor: '#e3f2fd',
                              '&:hover': {
                                backgroundColor: '#bbdefb'
                              }
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Typography variant="h6">{table.icon}</Typography>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                  {table.name.replace('_', ' ').toUpperCase()}
                                </Typography>
                                {hasError && (
                                  <Chip
                                    label="Error"
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: '0.7rem',
                                      backgroundColor: '#ffebee',
                                      color: '#c62828'
                                    }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem' }}>
                                  {recordCount.toLocaleString()} records
                                </Typography>
                                {tableData?.lastUpdated && (
                                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.7rem' }}>
                                    Updated {new Date(tableData.lastUpdated).toLocaleTimeString()}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </Box>

              {/* Main Content Area */}
              <Box sx={{ flex: 1 }}>
                  <Card elevation={2} sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 0 }}>
                {/* Table Header */}
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#333' }}>
                      {selectedTable.name.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#666', fontSize: '1.2rem' }}>
                      {selectedTable.icon}
                    </Typography>
                    {realData[selectedTable.name] && (
                      <Chip
                        label={`${realData[selectedTable.name].count?.toLocaleString() || 0} Records`}
                        size="small"
                        sx={{
                          backgroundColor: '#e8f5e8',
                          color: '#2e7d32',
                          fontWeight: 500
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    {selectedTable.description}
                  </Typography>
                </Box>

                {/* Table Content - Real Data */}
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                    📊 Live Data
                  </Typography>

                  {realData[selectedTable.name]?.error ? (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      <Typography variant="body2">
                        <strong>Error loading data:</strong> {realData[selectedTable.name].error}
                      </Typography>
                    </Alert>
                  ) : realData[selectedTable.name]?.recentEntries?.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, color: '#666' }}>
                        Recent Entries (Last {realData[selectedTable.name].recentEntries.length})
                      </Typography>

                      {realData[selectedTable.name].recentEntries.map((entry, index) => (
                        <Card key={entry.id} elevation={1} sx={{ mb: 2, borderRadius: 1 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333' }}>
                                ID: {entry.id}
                              </Typography>
                              <Button
                                size="small"
                                onClick={() => toggleExpandedRow(selectedTable.name, entry.id)}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                              >
                                {expandedRows[`${selectedTable.name}-${entry.id}`] ?
                                  <ExpandLessIcon fontSize="small" /> :
                                  <ExpandMoreIcon fontSize="small" />
                                }
                              </Button>
                            </Box>

                            <Collapse in={expandedRows[`${selectedTable.name}-${entry.id}`]}>
                              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                                <TableContainer>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow sx={{ backgroundColor: '#e9ecef' }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Field</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1 }}>Value</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {selectedTable.fields.map((field) => {
                                        const value = entry.data[field.name];
                                        return (
                                          <TableRow key={field.name}>
                                            <TableCell sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                              <code style={{
                                                backgroundColor: '#f1f1f1',
                                                padding: '1px 4px',
                                                borderRadius: '2px',
                                                fontSize: '0.75rem'
                                              }}>
                                                {field.name}
                                              </code>
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', py: 0.5 }}>
                                              <Chip
                                                label={field.type}
                                                size="small"
                                                sx={{
                                                  backgroundColor: getTypeColor(field.type),
                                                  color: 'white',
                                                  fontSize: '0.7rem',
                                                  height: 20
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem', py: 0.5, fontFamily: 'monospace' }}>
                                              {formatValue(value, field.type)}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Box>
                            </Collapse>
                          </CardContent>
                        </Card>
                      ))}

                      <Alert severity="info" sx={{ mt: 3, borderRadius: 1 }}>
                        <Typography variant="body2">
                          <strong>Note:</strong> Showing the most recent {realData[selectedTable.name].recentEntries.length} entries.
                          Use the refresh button to get the latest data. Total records: {realData[selectedTable.name].count?.toLocaleString() || 0}
                        </Typography>
                      </Alert>
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: 1 }}>
                      <Typography variant="body2">
                        <strong>No data available</strong> - This collection may be empty or there was an error loading the data.
                      </Typography>
                    </Alert>
                  )}

                  {/* Schema Reference */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
                      📋 Schema Reference
                    </Typography>

                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: '0.85rem' }}>
                              Field Name
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: '0.85rem' }}>
                              Data Type
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#333', fontSize: '0.85rem' }}>
                              Description
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedTable.fields.map((field, index) => (
                            <TableRow
                              key={field.name}
                              sx={{
                                '&:nth-of-type(odd)': {
                                  backgroundColor: '#fafafa',
                                }
                              }}
                            >
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                <code style={{
                                  backgroundColor: '#f1f1f1',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  fontSize: '0.75rem'
                                }}>
                                  {field.name}
                                </code>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                <Chip
                                  label={field.type}
                                  size="small"
                                  sx={{
                                    backgroundColor: getTypeColor(field.type),
                                    color: 'white',
                                    fontSize: '0.7rem',
                                    height: 18
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: '#555', lineHeight: 1.4, fontSize: '0.8rem' }}>
                                {field.description}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
          )}

          {/* Relationships Explorer Tab */}
          {activeTab === 'relationships' && (
          <Box sx={{ flex: 1 }}>
            <Card elevation={2} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ p: 0 }}>
                {/* Database Relationships Header */}
                <Box sx={{ p: 3, pb: 2, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                    🔗 Database Relationships & Foreign Keys
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666' }}>
                    Explore table relationships, foreign keys, and data flow connections
                  </Typography>
                </Box>

                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, color: '#333' }}>
                    🔗 Database Relationships & Foreign Keys
                  </Typography>

                  {/* Visual Relationship Diagram */}
                  <Box sx={{ mb: 4, p: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
                      📋 Relationship Flow
                    </Typography>

                    {/* Relationship Flow Visualization */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Users as Central Hub */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Box sx={{
                          px: 2, py: 1, backgroundColor: '#e3f2fd', borderRadius: 2,
                          border: '2px solid #2196f3', fontWeight: 600, color: '#1976d2'
                        }}>
                          👥 Users (Primary Table)
                        </Box>
                        <Typography variant="h6" sx={{ color: '#666' }}>→</Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Box sx={{
                            px: 2, py: 1, backgroundColor: '#f3e5f5', borderRadius: 2,
                            border: '1px solid #ba68c8', color: '#7b1fa2'
                          }}>
                            🎙️ Connect Chats
                          </Box>
                          <Box sx={{
                            px: 2, py: 1, backgroundColor: '#fff3e0', borderRadius: 2,
                            border: '1px solid #ffb74d', color: '#f57c00'
                          }}>
                            🤝 Connection Requests
                          </Box>
                          <Box sx={{
                            px: 2, py: 1, backgroundColor: '#e8f5e8', borderRadius: 2,
                            border: '1px solid #81c784', color: '#388e3c'
                          }}>
                            📊 Usage Statistics
                          </Box>
                        </Box>
                      </Box>

                      {/* Connect Chats Flow */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 4 }}>
                        <Box sx={{
                          px: 2, py: 1, backgroundColor: '#f3e5f5', borderRadius: 2,
                          border: '1px solid #ba68c8', color: '#7b1fa2'
                        }}>
                          🎙️ Connect Chats
                        </Box>
                        <Typography variant="body1" sx={{ color: '#666' }}>↔</Typography>
                        <Box sx={{
                          px: 2, py: 1, backgroundColor: '#fff3e0', borderRadius: 2,
                          border: '1px solid #ffb74d', color: '#f57c00'
                        }}>
                          🤝 Connection Requests
                        </Box>
                      </Box>
                    </Box>

                    {/* Foreign Key Details */}
                    <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', mb: 2 }}>
                        🔑 Foreign Key Mappings
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                              👥 Users → 🎙️ Connect Chats
                            </Typography>
                            <Box sx={{ pl: 2, borderLeft: '3px solid #1976d2' }}>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                <code style={{ backgroundColor: '#f0f7ff', padding: '1px 4px', borderRadius: '2px' }}>connect_chats.senderId</code> → <code style={{ backgroundColor: '#f0f7ff', padding: '1px 4px', borderRadius: '2px' }}>users.userId</code>
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57c00', mb: 1 }}>
                              👥 Users → 🤝 Connection Requests
                            </Typography>
                            <Box sx={{ pl: 2, borderLeft: '3px solid #f57c00' }}>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                <code style={{ backgroundColor: '#fff8e1', padding: '1px 4px', borderRadius: '2px' }}>connection_requests.fromUserId</code> → <code style={{ backgroundColor: '#f0f7ff', padding: '1px 4px', borderRadius: '2px' }}>users.userId</code><br/>
                                <code style={{ backgroundColor: '#fff8e1', padding: '1px 4px', borderRadius: '2px' }}>connection_requests.toUserId</code> → <code style={{ backgroundColor: '#f0f7ff', padding: '1px 4px', borderRadius: '2px' }}>users.userId</code>
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2', mb: 1 }}>
                              🎙️ Connect Chats ↔ 🤝 Connection Requests
                            </Typography>
                            <Box sx={{ pl: 2, borderLeft: '3px solid #7b1fa2' }}>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                <code style={{ backgroundColor: '#f3e5f5', padding: '1px 4px', borderRadius: '2px' }}>connect_chats.sessionId</code> → <code style={{ backgroundColor: '#fff8e1', padding: '1px 4px', borderRadius: '2px' }}>connection_requests.sessionId</code>
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#388e3c', mb: 1 }}>
                              👥 Users → 📊 Usage Statistics
                            </Typography>
                            <Box sx={{ pl: 2, borderLeft: '3px solid #388e3c' }}>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                <em>Aggregated data from users table (no direct foreign key)</em>
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    {/* Users Relationships */}
                    <Grid item xs={12} md={6}>
                      <Card elevation={2} sx={{
                        borderRadius: 2,
                        border: '2px solid #1976d2',
                        background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>👥</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              Users Table
                            </Typography>
                            <Chip label="PRIMARY" size="small" sx={{ backgroundColor: '#1976d2', color: 'white' }} />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                            Central user management table - referenced by all other tables:
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{
                              p: 2, borderRadius: 1, border: '1px solid #ba68c8',
                              backgroundColor: '#f3e5f5'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2', mb: 1 }}>
                                🎙️ Connect Chats Relationship
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Foreign Key: <code style={{ backgroundColor: '#f3e5f5', padding: '1px 4px', borderRadius: '2px' }}>senderId</code> → <code style={{ backgroundColor: '#e3f2fd', padding: '1px 4px', borderRadius: '2px' }}>userId</code>
                              </Typography>
                            </Box>

                            <Box sx={{
                              p: 2, borderRadius: 1, border: '1px solid #ffb74d',
                              backgroundColor: '#fff3e0'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57c00', mb: 1 }}>
                                🤝 Connection Requests Relationship
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Foreign Keys: <code style={{ backgroundColor: '#fff3e0', padding: '1px 4px', borderRadius: '2px' }}>fromUserId</code>, <code style={{ backgroundColor: '#fff3e0', padding: '1px 4px', borderRadius: '2px' }}>toUserId</code> → <code style={{ backgroundColor: '#e3f2fd', padding: '1px 4px', borderRadius: '2px' }}>userId</code>
                              </Typography>
                            </Box>

                            <Box sx={{
                              p: 2, borderRadius: 1, border: '1px solid #81c784',
                              backgroundColor: '#e8f5e8'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#388e3c', mb: 1 }}>
                                📊 Usage Statistics Relationship
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                <em>Data Aggregation:</em> User activity metrics collected daily
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Connect Chats Relationships */}
                    <Grid item xs={12} md={6}>
                      <Card elevation={2} sx={{
                        borderRadius: 2,
                        border: '2px solid #7b1fa2',
                        background: 'linear-gradient(135deg, #f8f5ff 0%, #ffffff 100%)'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>🎙️</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#7b1fa2' }}>
                              Connect Chats
                            </Typography>
                            <Chip label="CHILD" size="small" sx={{ backgroundColor: '#7b1fa2', color: 'white' }} />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                            Voice conversation sessions with foreign key relationships:
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{
                              p: 2, borderRadius: 1, border: '1px solid #1976d2',
                              backgroundColor: '#e3f2fd'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                                👥 Users Relationship
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Foreign Key: <code style={{ backgroundColor: '#f3e5f5', padding: '1px 4px', borderRadius: '2px' }}>senderId</code> → <code style={{ backgroundColor: '#e3f2fd', padding: '1px 4px', borderRadius: '2px' }}>users.userId</code>
                              </Typography>
                            </Box>

                            <Box sx={{
                              p: 2, borderRadius: 1, border: '1px solid #f57c00',
                              backgroundColor: '#fff3e0'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#f57c00', mb: 1 }}>
                                🤝 Connection Requests Relationship
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                References: <code style={{ backgroundColor: '#f3e5f5', padding: '1px 4px', borderRadius: '2px' }}>sessionId</code> → <code style={{ backgroundColor: '#fff3e0', padding: '1px 4px', borderRadius: '2px' }}>connection_requests.sessionId</code>
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Connection Requests Relationships */}
                    <Grid item xs={12} md={6}>
                      <Card elevation={2} sx={{
                        borderRadius: 2,
                        border: '2px solid #f57c00',
                        background: 'linear-gradient(135deg, #fff8e1 0%, #ffffff 100%)'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>🤝</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57c00' }}>
                              Connection Requests
                            </Typography>
                            <Chip label="LINKING" size="small" sx={{ backgroundColor: '#f57c00', color: 'white' }} />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                            Connect session initiation requests linking users:
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{
                              p: 2, borderRadius: 1, border: '1px solid #1976d2',
                              backgroundColor: '#e3f2fd'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                                👥 Users Relationships
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Foreign Keys: <code style={{ backgroundColor: '#fff3e0', padding: '1px 4px', borderRadius: '2px' }}>fromUserId</code>, <code style={{ backgroundColor: '#fff3e0', padding: '1px 4px', borderRadius: '2px' }}>toUserId</code> → <code style={{ backgroundColor: '#e3f2fd', padding: '1px 4px', borderRadius: '2px' }}>users.userId</code>
                              </Typography>
                            </Box>

                            <Box sx={{
                              p: 2, borderRadius: 1, border: '1px solid #7b1fa2',
                              backgroundColor: '#f3e5f5'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#7b1fa2', mb: 1 }}>
                                🎙️ Connect Chats Relationship
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666' }}>
                                Creates: <code style={{ backgroundColor: '#fff3e0', padding: '1px 4px', borderRadius: '2px' }}>sessionId</code> → used by <code style={{ backgroundColor: '#f3e5f5', padding: '1px 4px', borderRadius: '2px' }}>connect_chats.sessionId</code>
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Usage Statistics */}
                    <Grid item xs={12} md={6}>
                      <Card elevation={2} sx={{
                        borderRadius: 2,
                        border: '2px solid #388e3c',
                        background: 'linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%)'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>📊</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#388e3c' }}>
                              Usage Statistics
                            </Typography>
                            <Chip label="ANALYTICS" size="small" sx={{ backgroundColor: '#388e3c', color: 'white' }} />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                            Aggregated analytics data derived from user activity:
                          </Typography>

                          <Box sx={{
                            p: 2, borderRadius: 1, border: '1px solid #1976d2',
                            backgroundColor: '#e3f2fd'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2', mb: 1 }}>
                              👥 Users Data Aggregation
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#666' }}>
                              <em>No Direct Foreign Keys</em> - Daily snapshots of user metrics (logins, registrations, activity)
                            </Typography>
                          </Box>

                          <Typography variant="caption" sx={{ color: '#888', fontStyle: 'italic', mt: 2, display: 'block' }}>
                            Independent analytics table with historical data
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Settings */}
                    <Grid item xs={12}>
                      <Card elevation={2} sx={{
                        borderRadius: 2,
                        border: '2px solid #666',
                        background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>⚙️</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#666' }}>
                              Settings
                            </Typography>
                            <Chip label="CONFIG" size="small" sx={{ backgroundColor: '#666', color: 'white' }} />
                          </Box>

                          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                            Global application configuration:
                          </Typography>

                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              <strong>Independent Table:</strong> Contains app-wide settings like backend URLs and APK download links
                            </Typography>

                            <Typography variant="body2" sx={{ color: '#666' }}>
                              <strong>Used by Mobile App:</strong> Settings are loaded during app initialization to configure API endpoints
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Relationship Legend */}
                  <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                      🔗 Relationship Types
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#387ADF', fontWeight: 500 }}>
                          → Foreign Key
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Direct reference between tables
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#666', fontStyle: 'italic' }}>
                          → Aggregation
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Data aggregated from other tables
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ color: '#888', fontWeight: 500 }}>
                          → Independent
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Standalone configuration table
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          )}
        </>
      </Box>
    </Box>
  );
};

export default FirebaseStructureTab;
