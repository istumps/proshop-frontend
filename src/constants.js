// // export const BASE_URL =
// //   process.env.NODE_ENV === 'develeopment' ? 'http://localhost:5000' : '';


// export const BASE_URL = ''; // If using proxy
// export const PRODUCTS_URL = '/api/products';
// export const USERS_URL = '/api/users';
// export const ORDERS_URL = '/api/orders';
// export const PAYPAL_URL = '/api/config/paypal';

export const BASE_URL = 'https://rr57u0qsu5.execute-api.us-east-1.amazonaws.com'

export const PRODUCTS_URL = `${BASE_URL}/api/products`;
export const USERS_URL = `${BASE_URL}/api/users`;
export const ORDERS_URL = `${BASE_URL}/api/orders`;
export const PAYPAL_URL = `${BASE_URL}/api/config/paypal`;
