export const addDecimals = (num) => {
  return (Math.round(num * 100) / 100).toFixed(2);
};

// NOTE: the code below has been changed from the course code to fix an issue
// with type coercion of strings to numbers.
// Our addDecimals function expects a number and returns a string, so it is not
// correct to call it passing a string as the argument.

export const updateCart = (state) => {
  try {
    // Simple calculation of prices
    const itemsPrice = state.cartItems.reduce(
      (acc, item) => acc + item.price * item.qty, 
      0
    );
    
    state.itemsPrice = addDecimals(itemsPrice);
    state.shippingPrice = addDecimals(itemsPrice > 100 ? 0 : 10);
    state.taxPrice = addDecimals(itemsPrice * 0.15);
    state.totalPrice = addDecimals(
      Number(state.itemsPrice) + 
      Number(state.shippingPrice) + 
      Number(state.taxPrice)
    );
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(state));
    console.log('Cart saved, items:', state.cartItems.length);
    
    return state;
  } catch (error) {
    console.error('Error in updateCart:', error);
    return state;
  }
};
