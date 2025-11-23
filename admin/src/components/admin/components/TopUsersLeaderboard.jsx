import {
  Card,
  CardContent,
  Box,
  Typography,
  Grid,
  Chip,
  Avatar
} from '@mui/material';
import {
  Star as StarIcon,
  Email as EmailIcon
} from '@mui/icons-material';

const TopUsersLeaderboard = ({ usageStats }) => {
  const getRankedUsers = () => {
    if (!usageStats.dailyLoginUsage || usageStats.dailyLoginUsage.length === 0) {
      return [];
    }

    const userLoginCounts = {};
    usageStats.dailyLoginUsage.forEach(day => {
      day.users?.forEach(user => {
        if (!userLoginCounts[user.email]) {
          userLoginCounts[user.email] = {
            email: user.email,
            accountType: user.accountType,
            profileImageUrl: user.profileImageUrl,
            username: user.username,
            count: 0
          };
        }
        userLoginCounts[user.email].count++;
      });
    });
    
    return Object.values(userLoginCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const rankedUsers = getRankedUsers();

  return (
    <Card 
      elevation={0}
      sx={{ 
        borderRadius: 3,
        background: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #eee',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, #6c757d 0%, #495057 100%)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 4px 10px rgba(108, 117, 125, 0.3)'
              }}
            >
              <StarIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: '#333'
                }}
              >
                Top Active Users
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Most frequent users in the last 7 days
              </Typography>
            </Box>
          </Box>
          
          <Chip 
            label={`Top ${Math.min(10, rankedUsers.length)}`}
            size="small"
            sx={{
              background: '#f8f9fa',
              color: '#666',
              fontWeight: 600,
              border: '1px solid #eee'
            }}
          />
        </Box>
        
        <Box sx={{ flex: 1 }}>
          {rankedUsers.length > 0 ? (
            <Grid container spacing={2}>
              {rankedUsers.map((user, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      borderRadius: 2,
                      background: index < 3 ? 
                        (index === 0 ? 'linear-gradient(135deg, #FBA834 0%, #ff9800 100%)' :
                         index === 1 ? 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)' :
                         'linear-gradient(135deg, #cd7f32 0%, #b8860b 100%)') :
                        '#f8f9fa',
                      color: index < 3 ? 'white' : 'inherit',
                      border: index < 3 ? 'none' : '1px solid #e0e0e0',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      height: '160px', // Fixed height for consistent sizing
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: index < 3 ? 
                          '0 12px 25px rgba(251, 168, 52, 0.3)' : 
                          '0 4px 12px rgba(0, 0, 0, 0.08)',
                      },
                      '&::before': index < 3 ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
                        zIndex: 1
                      } : {}
                    }}
                  >
                    <CardContent sx={{ p: 2, textAlign: 'center', position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
                      {/* Rank Badge */}
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: index < 3 ? 'rgba(255, 255, 255, 0.2)' : '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: index < 3 ? 'white' : '#666',
                          fontWeight: 'bold',
                          fontSize: '0.8rem',
                          border: index < 3 ? '2px solid rgba(255,255,255,0.3)' : '1px solid #e0e0e0',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        #{index + 1}
                      </Box>
                      
                      {/* Trophy Icon for Top 3 */}
                      {index < 3 && (
                        <Box sx={{ mb: 1 }}>
                          <StarIcon 
                            sx={{ 
                              fontSize: 20, 
                              color: 'white',
                              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
                            }} 
                          />
                        </Box>
                      )}
                      
                      {/* User Avatar */}
                      <Box sx={{ mb: 1.5 }}>
                        <Avatar
                          src={user.profileImageUrl && user.profileImageUrl !== 'none' ? user.profileImageUrl : undefined}
                          sx={{ 
                            width: 50,
                            height: 50,
                            margin: '0 auto',
                            border: index < 3 ? '3px solid rgba(255,255,255,0.4)' : '3px solid white',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                            bgcolor: index < 3 ? 'rgba(255,255,255,0.2)' : '#387ADF'
                          }}
                        >
                          {!user.profileImageUrl || user.profileImageUrl === 'none' ? (
                            <EmailIcon 
                              sx={{ 
                                fontSize: 24, 
                                color: 'white'
                              }} 
                            />
                          ) : null}
                        </Avatar>
                      </Box>
                      
                      {/* User Name or Email */}
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 0.5,
                          color: index < 3 ? 'white' : '#333',
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2
                        }}
                        title={user.username || user.email}
                      >
                        {user.username ? 
                          (user.username.length > 12 ? `${user.username.substring(0, 12)}...` : user.username) :
                          (user.email.length > 12 ? `${user.email.substring(0, 12)}...` : user.email)
                        }
                      </Typography>
                      
                      {/* Account Type Badge */}
                      {user.accountType === 'premium' && (
                        <Box sx={{ mt: 'auto' }}>
                          <Chip 
                            label="Premium" 
                            size="small" 
                            sx={{
                              background: index < 3 ? 'rgba(255, 255, 255, 0.2)' : '#FBA834',
                              color: 'white',
                              fontSize: '0.65rem',
                              height: 20,
                              fontWeight: 600,
                              border: index < 3 ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                              backdropFilter: 'blur(4px)'
                            }}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', flexDirection: 'column' }}>
              <StarIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="body2" color="textSecondary" align="center">
                No user activity data available for ranking
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TopUsersLeaderboard;
