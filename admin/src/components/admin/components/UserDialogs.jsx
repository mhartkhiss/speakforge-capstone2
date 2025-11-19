import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelCircleIcon
} from '@mui/icons-material';

const UserDialogs = ({
  showAddUser,
  onCloseAddUser,
  newUser,
  onNewUserChange,
  onAddUser,
  editModalOpen,
  onCloseEditModal,
  selectedAccountType,
  onAccountTypeChange,
  showUserDetails,
  onCloseUserDetails,
  selectedDay
}) => {
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

  return (
    <>
      {/* Add User Dialog */}
      <Dialog
        open={showAddUser}
        onClose={onCloseAddUser}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the email and password for the new user.
          </DialogContentText>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              id="email"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={newUser.email}
              onChange={(e) => onNewUserChange({...newUser, email: e.target.value})}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="password"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={newUser.password}
              onChange={(e) => onNewUserChange({...newUser, password: e.target.value})}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseAddUser}>
            Cancel
          </Button>
          <Button onClick={onAddUser} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editModalOpen}
        onClose={onCloseEditModal}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Edit User Account Type</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={selectedAccountType}
                onChange={onAccountTypeChange}
                label="Account Type"
                autoFocus
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="premium">Premium</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEditModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog
        open={showUserDetails}
        onClose={onCloseUserDetails}
        maxWidth="sm"
        fullWidth
        className="user-details-dialog"
      >
        <DialogTitle>
          Users Logged In on {selectedDay ? new Date(selectedDay.date).toLocaleDateString() : ''}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell>Login Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedDay && selectedDay.users && selectedDay.users.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {getAccountTypeChip(user.accountType)}
                    </TableCell>
                    <TableCell>
                      {new Date(user.loginTime).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseUserDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserDialogs; 