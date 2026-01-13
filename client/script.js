document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });
  }
  
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  let cart = [];
  const cartCount = document.getElementById('cart-count');
  const grid = document.querySelector('.grid');

  // --- Product Functions ---
  
  async function fetchProducts() {
    try {
      const products = await apiRequest(getAPIUrl(API_CONFIG.endpoints.products));
      if (products && products.length > 0) {
        renderProducts(products);
        return true;
      }
    } catch (error) {
      console.warn('Could not fetch products from backend, using hardcoded products:', error.message);
    }
    return false;
  }

  function renderProducts(products) {
    if (!grid) return;
    
    grid.innerHTML = '';
    
    products.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('data-id', product._id || product.id);
      card.setAttribute('data-name', product.name);
      card.setAttribute('data-price', product.price);
      card.setAttribute('data-image', product.image);
      
      // Add badges based on index or product properties
      let badgeHTML = '';
      if (index === 0) {
        badgeHTML = '<div class="product-badge best-seller">Best Seller</div>';
      } else if (index === 1) {
        badgeHTML = '<div class="product-badge new-item">New</div>';
      }
      
      card.innerHTML = `
        ${badgeHTML}
        <div class="image-container">
          <img src="${product.image}" alt="${product.name}" />
          <div class="card-overlay"></div>
        </div>
        <div class="product-info">
          <p class="product-name">${product.name}</p>
          <div class="product-rating">
            <span>★★★★☆</span> (4.8)
          </div>
          <p class="price">₹${product.price}</p>
          <div class="product-actions">
            <button class="btn add-to-cart">Add to Cart</button>
            <a href="#" class="btn btn-secondary">View Details</a>
          </div>
        </div>
      `;
      
      grid.appendChild(card);
    });
    // Event delegation works for dynamically added elements, no need to re-attach
  }

  function attachCartListeners() {
  if (grid) {
      // Event delegation - works for both hardcoded and dynamically added products
    grid.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart')) {
        const card = e.target.closest('.card');
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = parseInt(card.dataset.price, 10);
        const image = card.dataset.image;
        addToCart({ id, name, price, image });
      }
    });
    }
  }

  // --- Cart Functions ---

  function addToCart(product) {
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    if (existingProductIndex > -1) {
      cart[existingProductIndex].quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
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
      // Sync each item in cart to backend
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

  function updateCartCount() {
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalCount;
    }
  }

  // --- Initialize ---
  
  async function init() {
    // Initialize cart from localStorage
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
    updateCartCount();
    
    // Try to fetch products from backend
    const productsLoaded = await fetchProducts();
    if (!productsLoaded) {
      // Products not loaded from backend, use existing hardcoded products
      attachCartListeners();
    }
  }

  init();
});
