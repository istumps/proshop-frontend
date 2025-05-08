import { Button } from 'react-bootstrap';
import { useLogout } from '../utils/logoutUtils';

/**
 * A reusable logout button component
 * Can be used anywhere in the application
 */
const LogoutButton = ({ variant = 'primary', className = '', children = 'Logout', size }) => {
  const logout = useLogout();

  const handleLogout = async () => {
    await logout('/'); // Always redirect to home page
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleLogout}
      size={size}
    >
      {children}
    </Button>
  );
};

export default LogoutButton; 