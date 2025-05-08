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
      
      // Check if the item already exists in the cart by ID
      const existingItemIndex = state.cartItems.findIndex(
        (x) => x._id === item._id
      );
      
      if (existingItemIndex !== -1) {
        // Item exists, update only its quantity
        console.log(`Updating item at index ${existingItemIndex} with qty: ${item.qty}`);
        
        // Create a new array with the updated item
        const updatedItems = [...state.cartItems];
        // Only update the qty property while preserving other properties
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          qty: item.qty
        };
        
        state.cartItems = updatedItems;
      } else {
        // Item doesn't exist, add it to the cart
        console.log('Adding new item to cart:', item.name);
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
      return updateCart(state);
    },
    
    savePaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
      return updateCart(state);
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
