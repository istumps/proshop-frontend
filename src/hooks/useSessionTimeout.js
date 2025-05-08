import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createSessionTimeoutHandler } from '../utils/tokenUtils';
import { clearUserSession } from '../utils/logoutUtils';

/**
 * Hook that checks for token expiration at a specified interval
 * and logs the user out if their token has expired
 *
 * @param {number} checkInterval - Interval in milliseconds to check token expiration
 * @returns {void}
 */
const useSessionTimeout = (checkInterval = 60000) => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Create the session timeout handler
    const checkSession = createSessionTimeoutHandler(dispatch, clearUserSession);
    
    // Check immediately
    checkSession();
    
    // Then set up interval
    const intervalId = setInterval(checkSession, checkInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [dispatch, checkInterval]);
};

export default useSessionTimeout; 