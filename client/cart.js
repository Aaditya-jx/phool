document.addEventListener('DOMContentLoaded', () => {
  let cart = [];
  let shippingAddress = {};
  const cartCount = document.getElementById('cart-count');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartSection = document.querySelector('.cart-section');
  const cartSummary = document.querySelector('.cart-summary');

  // Shipping elements
  const shippingSection = document.querySelector('.shipping-section');
  const shippingForm = document.getElementById('shipping-form');
  const continueToPaymentBtn = document.getElementById('continue-to-payment-btn');

  // Payment elements
  const paymentSection = document.querySelector('.payment-section');
  const checkoutBtn = document.getElementById('checkout-btn');
  const backToShippingBtn = document.getElementById('back-to-cart-btn');

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
    syncCartToBackend();
  }

  async function syncCartToBackend() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      for (const item of cart) {
        await apiRequest(getAPIUrl(API_CONFIG.endpoints.cart), {
          method: 'POST',
          body: { productId: item.id, quantity: item.quantity }
        });
      }
    } catch (error) {
      console.warn('Could not sync cart to backend:', error.message);
    }
  }

  async function removeFromBackendCart(productId) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

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
      shippingSection.classList.add('hidden');
      paymentSection.classList.add('hidden');
      const shippingBtn = document.getElementById('proceed-to-shipping-btn');
      if(shippingBtn) shippingBtn.style.display = 'none';
      updateProgressBar(1);
      return;
    }

    const shippingBtn = document.getElementById('proceed-to-shipping-btn');
    if(shippingBtn) shippingBtn.style.display = 'block';

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
    // Add proceed to shipping button if it doesn't exist
    if (!document.getElementById('proceed-to-shipping-btn') && cart.length > 0) {
      const proceedToShippingBtn = document.createElement('button');
      proceedToShippingBtn.id = 'proceed-to-shipping-btn';
      proceedToShippingBtn.className = 'btn';
      proceedToShippingBtn.textContent = 'Proceed to Shipping';
      cartSummary.appendChild(proceedToShippingBtn);

      proceedToShippingBtn.addEventListener('click', () => {
        cartSection.classList.add('hidden');
        shippingSection.classList.remove('hidden');
        updateProgressBar(2);
      });
    }
  }

  function updateProgressBar(currentStep) {
    progressSteps.forEach(step => {
      const stepNumber = parseInt(step.dataset.step, 10);
      step.classList.toggle('active', stepNumber <= currentStep);
    });
  }

  async function handleCheckout(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Please login to proceed with payment');
      window.location.href = 'login.html';
      return;
    }

    const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (total <= 0 || cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';

    try {
      const orderData = {
        orderItems: cart.map(item => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          image: item.image,
          product: item.id
        })),
        shippingAddress: shippingAddress,
        paymentMethod: 'razorpay',
        itemsPrice: total,
        taxPrice: 0,
        shippingPrice: 0,
        totalPrice: total
      };

      const response = await apiRequest(getAPIUrl(API_CONFIG.endpoints.orders), {
        method: 'POST',
        body: orderData
      });

      const { createdOrder, razorpayOrder } = response;
      const user = getCurrentUser();
      const userName = user ? user.name : 'Customer';
      const userEmail = user ? user.email : 'customer@example.com';

      const options = {
        key: 'rzp_test_S2UwgGjTCRAvqY',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Phoolishh Loveee',
        description: 'Order Payment',
        order_id: razorpayOrder.id,
        handler: async function(response) {
          try {
            await apiRequest(getAPIUrl(`${API_CONFIG.endpoints.orders}/${createdOrder._id}/pay`), {
              method: 'PUT',
              body: {
                id: response.razorpay_payment_id,
                status: 'success',
                update_time: new Date().toISOString(),
                email_address: userEmail
              }
            });

            confirmationModal.classList.remove('hidden');
            updateProgressBar(3);
            clearCart();
            cartSection.classList.remove('hidden');
            shippingSection.classList.add('hidden');
            paymentSection.classList.add('hidden');
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment successful but verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: shippingAddress.phone
        },
        theme: {
          color: '#ff6fae'
        },
        modal: {
          ondismiss: function() {
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Proceed to Checkout';
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function(response) {
        alert('Payment failed: ' + response.error.description);
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceed to Checkout';
      });
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed: ' + (error.message || 'Server error. Please try again.'));
      checkoutBtn.disabled = false;
      checkoutBtn.textContent = 'Proceed to Checkout';
    }
  }

  // --- Event Listeners ---
  cartItems.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-from-cart')) {
      await removeFromCart(e.target.dataset.id);
    }
  });

  shippingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    shippingAddress = {
      address: document.getElementById('address').value,
      city: document.getElementById('city').value,
      postalCode: document.getElementById('postalCode').value,
      country: document.getElementById('country').value,
      phone: document.getElementById('phone').value,
    };
    shippingSection.classList.add('hidden');
    paymentSection.classList.remove('hidden');
    updateProgressBar(3);
  });
  
  if (backToShippingBtn) {
    backToShippingBtn.addEventListener('click', () => {
      paymentSection.classList.add('hidden');
      shippingSection.classList.remove('hidden');
      updateProgressBar(2);
    });
  }

  checkoutBtn.addEventListener('click', handleCheckout);

  continueShoppingBtn.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
    window.location.href = 'index.html';
  });

  // --- Initialize ---
  loadCart();
  updateProgressBar(1);
});
