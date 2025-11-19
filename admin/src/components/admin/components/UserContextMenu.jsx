import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as LockResetIcon
} from '@mui/icons-material';

const UserContextMenu = ({ 
  contextMenu, 
  onClose, 
  onEdit, 
  onDelete, 
  onResetPassword 
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
      <MenuItem onClick={() => handleAction('resetPassword')}>
        <ListItemIcon>
          <LockResetIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Reset Password</ListItemText>
      </MenuItem>
      <MenuItem onClick={() => handleAction('delete')}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Delete User</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default UserContextMenu; 