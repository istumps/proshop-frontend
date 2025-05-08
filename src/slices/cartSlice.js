import { createSlice } from '@reduxjs/toolkit';
import { updateCart } from '../utils/cartUtils';

// Simple initial state
const initialState = {
  cartItems: [],
  shippingAddress: {},
  paymentMethod: 'PayPal',
  itemsPrice: '0.00',
  shippingPrice: '0.00',
  taxPrice: '0.00',
  totalPrice: '0.00',
};

// Try to load from localStorage
try {
  const cartData = localStorage.getItem('cart');
  if (cartData) {
    const parsedCart = JSON.parse(cartData);
    if (parsedCart && Array.isArray(parsedCart.cartItems)) {
      initialState.cartItems = parsedCart.cartItems;
      initialState.shippingAddress = parsedCart.shippingAddress || {};
      initialState.paymentMethod = parsedCart.paymentMethod || 'PayPal';
    }
  }
} catch (err) {
  console.error('Error loading cart from localStorage', err);
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { user, rating, numReviews, reviews, ...item } = action.payload;
      const existItem = state.cartItems.find((x) => x._id === item._id);

      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x._id === existItem._id ? item : x
        );
      } else {
        state.cartItems = [...state.cartItems, item];
      }

      return updateCart(state);
    },
    
    removeFromCart: (state, action) => {
      // Get the index to remove
      const indexToRemove = action.payload;
      console.log('Removing item at index:', indexToRemove);
      
      if (indexToRemove >= 0 && indexToRemove < state.cartItems.length) {
        // Remove the item at the specified index
        const newCartItems = [...state.cartItems];
        newCartItems.splice(indexToRemove, 1);
        state.cartItems = newCartItems;
        console.log('Item removed, remaining items:', state.cartItems.length);
      } else {
        console.error('Invalid index for removal:', indexToRemove);
      }
      
      return updateCart(state);
    },
    
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem('cart', JSON.stringify(state));
    },
    
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      localStorage.setItem('cart', JSON.stringify(state));
    },
    
    clearCartItems: (state, action) => {
      state.cartItems = [];
      return updateCart(state);
    },
    
    resetCart: (state) => {
      state.cartItems = [];
      state.shippingAddress = {};
      state.paymentMethod = 'PayPal';
      localStorage.removeItem('cart');
      return state;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  saveShippingAddress,
  savePaymentMethod,
  clearCartItems,
  resetCart,
} = cartSlice.actions;

export default cartSlice.reducer;
