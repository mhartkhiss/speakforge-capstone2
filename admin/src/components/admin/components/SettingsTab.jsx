import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { loadApiBaseUrl } from '../../../config';

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    backendUrl: '',
    apkDownloadUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();

      const response = await fetch(`${baseUrl}/settings/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();
      setSettings({
        backendUrl: data.backendUrl || '',
        apkDownloadUrl: data.apkDownloadUrl || ''
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      const token = localStorage.getItem('adminToken');
      const baseUrl = await loadApiBaseUrl();

      const response = await fetch(`${baseUrl}/settings/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          backendUrl: settings.backendUrl,
          apkDownloadUrl: settings.apkDownloadUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save settings: ${response.status}`);
      }

      const data = await response.json();
      setMessage({ type: 'success', text: data.message || 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        sx={{
          backgroundColor: '#f5f5f5',
          borderRadius: 1,
          m: 2
        }}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ ml: 2, color: '#333' }}>
          Loading settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header Section */}
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
              ⚙️ Application Settings
            </Typography>
            <Typography variant="body1" sx={{ color: '#666' }}>
              Configure backend URLs and mobile app settings
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={saveSettings}
            disabled={saving}
            size="small"
            sx={{
              px: 3,
              py: 1,
              fontSize: '0.9rem',
              fontWeight: 500,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #387ADF 0%, #50C4ED 100%)',
              boxShadow: '0 2px 8px rgba(56, 122, 223, 0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #2E6BCF 0%, #45B8E0 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(56, 122, 223, 0.3)'
              },
              '&:disabled': {
                background: '#ccc',
                color: '#666',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            {saving ? (
              <>
                <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              '💾 Save'
            )}
          </Button>
        </Box>

        {message.text && (
          <Alert
            severity={message.type}
            sx={{
              mt: 2,
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.2rem'
              }
            }}
          >
            {message.text}
          </Alert>
        )}
      </Box>

      {/* Settings Cards */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 6,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardHeader
                title="🔗 Backend Configuration"
                subheader="Configure the backend API endpoint"
                sx={{
                  pb: 1,
                  '& .MuiCardHeader-title': {
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#333'
                  },
                  '& .MuiCardHeader-subheader': {
                    color: '#666',
                    fontSize: '0.9rem'
                  }
                }}
              />
              <CardContent sx={{ pt: 0 }}>
                <TextField
                  fullWidth
                  label="Backend URL"
                  value={settings.backendUrl}
                  onChange={handleInputChange('backendUrl')}
                  placeholder="https://your-backend-url.com/api/"
                  helperText="This URL will be used by the mobile app to communicate with the backend"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#fafafa'
                    }
                  }}
                  InputLabelProps={{
                    sx: { color: '#555' }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card
              elevation={3}
              sx={{
                borderRadius: 3,
                border: '1px solid #e0e0e0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 6,
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardHeader
                title="📱 Mobile App Configuration"
                subheader="Configure mobile app download settings"
                sx={{
                  pb: 1,
                  '& .MuiCardHeader-title': {
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#333'
                  },
                  '& .MuiCardHeader-subheader': {
                    color: '#666',
                    fontSize: '0.9rem'
                  }
                }}
              />
              <CardContent sx={{ pt: 0 }}>
                <TextField
                  fullWidth
                  label="APK Download URL"
                  value={settings.apkDownloadUrl}
                  onChange={handleInputChange('apkDownloadUrl')}
                  placeholder="https://drive.google.com/file/d/.../view?usp=drive_link"
                  helperText="This URL will be used for app download QR codes and sharing"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: '#fafafa'
                    }
                  }}
                  InputLabelProps={{
                    sx: { color: '#555' }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Footer Info */}
      <Box sx={{ px: 3, pb: 4 }}>
        <Typography
          variant="body2"
          sx={{
            color: '#888',
            textAlign: 'center',
            fontStyle: 'italic',
            fontSize: '0.85rem'
          }}
        >
          Changes will take effect immediately for new app sessions. Existing app installations may need to be restarted or updated.
        </Typography>
      </Box>
    </Box>
  );
};

export default SettingsTab;
