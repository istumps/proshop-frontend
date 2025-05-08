import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../slices/usersApiSlice';
import { logout } from '../slices/authSlice';
import { resetCart } from '../slices/cartSlice';

/**
 * Utility function to handle user logout
 * 
 * Example usage:
 * import { useLogout } from '../utils/logoutUtils';
 * 
 * const Component = () => {
 *   const handleLogout = useLogout();
 *   
 *   return <button onClick={handleLogout}>Logout</button>;
 * }
 */
export const useLogout = () => {
  const [logoutApiCall] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return async (redirectTo = '/') => {
    try {
      // Try to call the logout API endpoint first
      try {
        await logoutApiCall().unwrap();
        console.log('Logout API call successful');
      } catch (apiError) {
        // Log but continue with local logout even if API call fails
        console.log('Logout API call failed, continuing with local logout:', apiError);
      }
      
      // Clear localStorage first (to avoid any synchronization issues)
      try {
        localStorage.removeItem('cart');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('expirationTime');
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
      
      // Then dispatch Redux actions
      try {
        // Dispatch one action at a time to avoid race conditions
        dispatch(logout());
        // Short delay to ensure state updates properly
        await new Promise(resolve => setTimeout(resolve, 10));
        dispatch(resetCart());
      } catch (reduxError) {
        console.error('Redux state update error:', reduxError);
      }
      
      console.log('Logged out successfully, redirecting to', redirectTo);
      
      // Finally force page reload to ensure a clean state
      window.location.href = redirectTo === '/' ? '/' : redirectTo;
      return true;
    } catch (error) {
      console.error('Logout process failed:', error);
      
      // Force reload as fallback
      window.location.href = '/';
      return false;
    }
  };
};

/**
 * Function to clear all user data without API call
 * Useful for handling session timeouts or forced logouts
 */
export const clearUserSession = (dispatch) => {
  if (!dispatch) {
    console.error('Dispatch function required');
    return false;
  }
  
  try {
    // Clear localStorage first
    try {
      localStorage.removeItem('cart');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('expirationTime');
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Then dispatch actions with a slight delay between them
    dispatch(logout());
    
    // Use setTimeout to ensure actions don't conflict
    setTimeout(() => {
      dispatch(resetCart());
      
      // Force page refresh after a short delay to ensure state updates
      setTimeout(() => {
        window.location.href = '/';
      }, 50);
    }, 50);
    
    return true;
  } catch (error) {
    console.error('Failed to clear user session:', error);
    
    // Force reload anyway
    window.location.href = '/';
    return false;
  }
}; 