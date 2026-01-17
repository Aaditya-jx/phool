document.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('product-form');
  const productList = document.getElementById('product-list');
  const productIdInput = document.getElementById('product-id');
  const nameInput = document.getElementById('name');
  const descriptionInput = document.getElementById('description');
  const priceInput = document.getElementById('price');
  const imageFileInput = document.getElementById('image-file');
  const imageUrlInput = document.getElementById('image-url');
  const cancelEditBtn = document.getElementById('cancel-edit');

  // Fetch all products and display them
  async function fetchProducts() {
    try {
      const products = await apiRequest(getAPIUrl(API_CONFIG.endpoints.products));
      productList.innerHTML = '';
      products.forEach(product => {
        const productEl = document.createElement('div');
        productEl.classList.add('product-item');
        productEl.innerHTML = `
          <img src="${product.image}" alt="${product.name}" width="100">
          <div>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>${product.price}</p>
          </div>
          <div>
            <button onclick="editProduct('${product._id}', '${product.name}', '${product.description}', '${product.price}', '${product.image}')">Edit</button>
            <button onclick="deleteProduct('${product._id}')">Delete</button>
          </div>
        `;
        productList.appendChild(productEl);
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products. Please try again.');
    }
  }

  // Handle form submission for adding/editing products
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = productIdInput.value;
    
    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('description', descriptionInput.value);
    formData.append('price', parseFloat(priceInput.value));
    
    const imageFile = imageFileInput.files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (imageUrlInput.value) {
      formData.append('image', imageUrlInput.value);
    }

    try {
      if (id) {
        // Update existing product
        await apiRequest(getAPIUrl(`${API_CONFIG.endpoints.products}/${id}`), {
          method: 'PUT',
          body: formData,
        });
        alert('Product updated successfully!');
      } else {
        // Add new product
        await apiRequest(getAPIUrl(API_CONFIG.endpoints.products), {
          method: 'POST',
          body: formData,
        });
        alert('Product added successfully!');
      }
      productForm.reset();
      productIdInput.value = '';
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  });

  // Cancel edit mode
  cancelEditBtn.addEventListener('click', () => {
    productForm.reset();
    productIdInput.value = '';
    cancelEditBtn.style.display = 'none';
  });

  // Edit a product
  window.editProduct = (id, name, description, price, image) => {
    productIdInput.value = id;
    nameInput.value = name;
    descriptionInput.value = description;
    priceInput.value = price;
    imageUrlInput.value = image;
    cancelEditBtn.style.display = 'inline-block';
    window.scrollTo(0, 0);
  };

  // Delete a product
  window.deleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await apiRequest(getAPIUrl(`${API_CONFIG.endpoints.products}/${id}`), { method: 'DELETE' });
        alert('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  // Initial fetch of products
  fetchProducts();
});
