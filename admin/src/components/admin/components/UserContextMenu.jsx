import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

const UserContextMenu = ({ 
  contextMenu, 
  onClose, 
  onEdit, 
  onDelete, 
  onResetPassword,
  onToggleAdmin
}) => {
  const handleAction = (action) => {
    const { userId, user } = contextMenu;
    
    switch (action) {
      case 'edit':
        onEdit(userId, user);
        break;
      case 'delete':
        onDelete(userId);
        break;
      case 'resetPassword':
        onResetPassword(user.email);
        break;
      case 'toggleAdmin':
        if (onToggleAdmin) onToggleAdmin(userId, !user.isAdmin);
        break;
      default:
        break;
    }
    
    onClose();
  };

  return (
    <Menu
      open={contextMenu.open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu.mouseY !== null && contextMenu.mouseX !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      className="context-menu"
    >
      <MenuItem onClick={() => handleAction('edit')}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Edit Account Type</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleAction('toggleAdmin')}>
        <ListItemIcon>
          <AdminIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          {contextMenu.user?.isAdmin ? 'Remove Admin Role' : 'Promote to Admin'}
        </ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleAction('resetPassword')}>
        <ListItemIcon>
          <LockResetIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Reset Password</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem onClick={() => handleAction('delete')} sx={{ color: 'error.main' }}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText>Delete User</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default UserContextMenu; 