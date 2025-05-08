/**
 * Check if a JWT token has expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired, false otherwise
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Extract the payload from the JWT
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    // Check if exp claim exists
    if (!payload.exp) return false;
    
    // Convert exp to milliseconds and compare with current time
    const expTimeMs = payload.exp * 1000;
    const currentTimeMs = Date.now();
    
    return currentTimeMs > expTimeMs;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    // If we can't parse the token, consider it expired
    return true;
  }
};

/**
 * Create a session timeout handler
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} clearSession - Function to clear user session
 * @returns {Function} - Function to check token and logout if expired
 */
export const createSessionTimeoutHandler = (dispatch, clearSession) => {
  return () => {
    // Get token from localStorage
    const userInfoStr = localStorage.getItem('userInfo');
    if (!userInfoStr) return;
    
    try {
      const userInfo = JSON.parse(userInfoStr);
      if (!userInfo || !userInfo.token) return;
      
      // Check if token is expired
      if (isTokenExpired(userInfo.token)) {
        clearSession(dispatch);
        // You could also display a message here that the session has expired
        console.log('Your session has expired. Please login again.');
      }
    } catch (error) {
      console.error('Error in session timeout handler:', error);
    }
  };
}; 