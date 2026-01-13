document.addEventListener('DOMContentLoaded', () => {
  let cart = [];
  const cartCount = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');

  // Payment elements
  const paymentSection = document.querySelector('.payment-section');
  const checkoutBtn = document.getElementById('checkout-btn');

  // Progress bar elements
  const progressSteps = document.querySelectorAll('.progress-step');

  // Modal elements
  const confirmationModal = document.getElementById('confirmation-modal');
  const continueShoppingBtn = document.getElementById('continue-shopping-btn');

  // --- Cart Functions ---

  function loadCart() {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        if (Array.isArray(parsedCart)) {
          cart = parsedCart;
        }
      }
    } catch (error) {
      console.error('Failed to parse cart from localStorage', error);
      localStorage.removeItem('cart');
    }
    updateCart();
  }

  async function removeFromCart(id) {
    const productIndex = cart.findIndex(item => item.id === id);
    if (productIndex > -1) {
      cart.splice(productIndex, 1);
    }
    updateCart();
    
    // Optionally remove from backend
    await removeFromBackendCart(id);
  }
  
  function clearCart() {
    cart = [];
    updateCart();
  }

  function updateCart() {
    renderCartItems();
    renderCartSummary();
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Optionally sync with backend if user is authenticated
    syncCartToBackend();
  }

  async function syncCartToBackend() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // User not authenticated, skip backend sync
      return;
    }

    try {
      // Sync cart to backend
      for (const item of cart) {
        await apiRequest(getAPIUrl(API_CONFIG.endpoints.cart), {
          method: 'POST',
          body: {
            productId: item.id,
            quantity: item.quantity
          }
        });
      }
    } catch (error) {
      console.warn('Could not sync cart to backend:', error.message);
    }
  }

  async function removeFromBackendCart(productId) {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    try {
      await apiRequest(getAPIUrl(`${API_CONFIG.endpoints.cart}/${productId}`), {
        method: 'DELETE'
      });
    } catch (error) {
      console.warn('Could not remove item from backend cart:', error.message);
    }
  }
  
  function renderCartItems() {
    cartItems.innerHTML = '';
    if (cart.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart-message">Your cart is empty. <a href="index.html#products">Continue Shopping</a></div>';
      if (paymentSection) {
        paymentSection.classList.add('hidden');
      }
      updateProgressBar(1);
      return;
    }
    
    if (paymentSection) {
      paymentSection.classList.remove('hidden');
    }
    updateProgressBar(2);

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;
    const tbody = table.querySelector('tbody');
    cart.forEach(item => {
      const tr = document.createElement('tr');
      tr.classList.add('cart-item-row');
      tr.innerHTML = `
        <td class="cart-item-prod" data-label="Product">
            <img src="${item.image}" alt="${item.name}" />
            <span>${item.name}</span>
        </td>
        <td data-label="Price">₹${item.price}</td>
        <td data-label="Quantity">${item.quantity}</td>
        <td data-label="Total">₹${item.price * item.quantity}</td>
        <td data-label="Remove"><button class="remove-from-cart" data-id="${item.id}">&times;</button></td>
      `;
      tbody.appendChild(tr);
    });
    cartItems.appendChild(table);
  }

  function renderCartSummary() {
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    cartTotal.textContent = `₹${total.toFixed(2)}`;
    if (cartCount) {
        cartCount.textContent = cart.reduce((acc, item) => acc + item.quantity, 0);
    }
  }

  // --- Progress Bar Functions ---
  function updateProgressBar(currentStep) {
    progressSteps.forEach(step => {
      const stepNumber = parseInt(step.dataset.step, 10);
      if (stepNumber === currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  // --- Payment Functions ---
  
  async function handleCheckout(e) {
    e.preventDefault();
    
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to proceed with payment');
      window.location.href = 'login.html';
      return;
    }

    // Get total amount
    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    
    if (total <= 0 || cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    // Disable button during processing
    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing...';
    }

    try {
      // Create order on backend
      const orderData = {
        orderItems: cart.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          image: item.image,
          product: item.id
        })),
        shippingAddress: {
          address: 'Sample Address',
          city: 'City',
          postalCode: '123456',
          country: 'India'
        },
        paymentMethod: 'razorpay',
        itemsPrice: total,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: total
      };

      // Create order and get Razorpay order
      const response = await apiRequest(getAPIUrl(API_CONFIG.endpoints.orders), {
        method: 'POST',
        body: orderData
      });

      const { createdOrder, razorpayOrder } = response;

      // Get user info
      const user = getCurrentUser();
      const userName = user ? user.name : 'Customer';
      const userEmail = user ? user.email : 'customer@example.com';

      // Razorpay options - using your test key
      const options = {
        key: 'rzp_test_S2UwgGjTCRAvqY', // Your Razorpay test key
        amount: razorpayOrder.amount, // Amount in paise
        currency: razorpayOrder.currency,
        name: 'Phoolishh Loveee',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async function(response) {
          // Payment success
          try {
            // Update order as paid
            await apiRequest(getAPIUrl(`${API_CONFIG.endpoints.orders}/${createdOrder._id}/pay`), {
              method: 'PUT',
              body: {
                id: response.razorpay_payment_id,
                status: 'success',
                update_time: new Date().toISOString(),
                email_address: userEmail
              }
            });

            // Show success message
      confirmationModal.classList.remove('hidden');
      updateProgressBar(3);
      clearCart();
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment successful but verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: '9999999999'
        },
        theme: {
          color: '#ff6fae'
        },
        modal: {
          ondismiss: function() {
            if (checkoutBtn) {
              checkoutBtn.disabled = false;
              checkoutBtn.textContent = 'Proceed to Checkout';
            }
          }
        }
      };

      // Open Razorpay checkout
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        alert('Payment failed: ' + response.error.description);
        if (checkoutBtn) {
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = 'Proceed to Checkout';
        }
      });
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error.message || 'Server error. Please try again.'));
      if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceed to Checkout';
      }
    }
  }

  // --- Event Listeners ---
  cartItems.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-from-cart')) {
      await removeFromCart(e.target.dataset.id);
    }
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  continueShoppingBtn.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
    window.location.href = 'index.html';
  });

  // --- Initialize ---
  loadCart();
});
