// This file will contain the admin order management logic for the admin panel.
// It will provide order list, order details, status update, and search/filter features.

// Admin Order Management Logic: Fetch, display, search/filter, and update orders

document.addEventListener('DOMContentLoaded', () => {
  fetchAndRenderOrders();
  document.getElementById('order-search').addEventListener('input', filterOrdersUI);
  document.getElementById('order-status-filter').addEventListener('change', filterOrdersUI);
});

let allOrders = [];

async function fetchAndRenderOrders() {
  try {
    allOrders = await apiRequest(getAPIUrl(API_CONFIG.endpoints.orders));
    renderOrders(allOrders);
  } catch (err) {
    document.getElementById('orders-list').innerHTML = '<tr><td colspan="7">Failed to load orders</td></tr>';
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-list');
  tbody.innerHTML = '';
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="8">No orders found</td></tr>';
    return;
  }
  orders.forEach(order => {
    const tr = document.createElement('tr');
    const shippingAddress = order.shippingAddress
      ? `${order.shippingAddress.address || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.postalCode || ''}, ${order.shippingAddress.country || ''}`
      : 'N/A';

    tr.innerHTML = `
      <td>${order._id}</td>
      <td>${order.user?.name || 'N/A'}</td>
      <td>${order.shippingAddress?.phone || 'N/A'}</td>
      <td>${shippingAddress}</td>
      <td><ul>${order.orderItems.map(i => `<li>${i.name} x${i.qty}</li>`).join('')}</ul></td>
      <td>₹${order.totalPrice}</td>
      <td><span class="status-${order.isDelivered ? 'delivered' : order.isPaid ? 'paid' : 'unpaid'}">${order.isDelivered ? 'Delivered' : order.isPaid ? 'Paid' : 'Unpaid'}</span></td>
      <td>
        <button onclick="showOrderDetails('${order._id}')">Details</button>
        <button onclick="showUpdateStatusModal('${order._id}')">Update Status</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterOrdersUI() {
  const search = document.getElementById('order-search').value.toLowerCase();
  const status = document.getElementById('order-status-filter').value;
  let filtered = allOrders;
  if (search) {
    filtered = filtered.filter(o =>
      (o.user?.name || '').toLowerCase().includes(search) ||
      (o._id || '').toLowerCase().includes(search) ||
      (o.isPaid ? 'paid' : o.isDelivered ? 'delivered' : 'unpaid').includes(search)
    );
  }
  if (status) {
    filtered = filtered.filter(o => {
      if (status === 'paid') return o.isPaid && !o.isDelivered;
      if (status === 'delivered') return o.isDelivered;
      if (status === 'unpaid') return !o.isPaid && !o.isDelivered;
      return true;
    });
  }
  renderOrders(filtered);
}

// Placeholder for modal logic
window.showOrderDetails = function(orderId) {
  alert('Order details for: ' + orderId + '\n(Implement modal for full details)');
};

window.showUpdateStatusModal = function(orderId) {
  const order = allOrders.find(o => o._id === orderId);
  if (!order) return alert('Order not found');
  const newStatus = prompt('Enter new status: paid, delivered, unpaid', order.isDelivered ? 'delivered' : order.isPaid ? 'paid' : 'unpaid');
  if (!newStatus) return;
  let update = {};
  if (newStatus === 'paid') update = { isPaid: true };
  if (newStatus === 'delivered') update = { isPaid: true, isDelivered: true };
  if (newStatus === 'unpaid') update = { isPaid: false, isDelivered: false };
  updateOrderStatus(orderId, update);
};

async function updateOrderStatus(orderId, update) {
  try {
    await apiRequest(getAPIUrl(`${API_CONFIG.endpoints.orders}/${orderId}/status`), {
      method: 'PUT',
      body: update
    });
    alert('Order status updated');
    fetchAndRenderOrders();
  } catch (err) {
    alert('Failed to update order status');
  }
}
