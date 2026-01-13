document.addEventListener('DOMContentLoaded', async () => {
    const ordersList = document.getElementById('orders-list');
    const user = getCurrentUser();

    // Redirect if not logged in or not an admin
    if (!isAuthenticated() || !user || !user.isAdmin) {
        alert('Access denied. You must be an admin to view this page.');
        window.location.href = 'index.html';
        return;
    }

    async function fetchOrders() {
        try {
            const orders = await apiRequest(getAPIUrl(API_CONFIG.endpoints.orders), {
                method: 'GET'
            });
            renderOrders(orders);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            ordersList.innerHTML = '<p class="error-message">Failed to load orders. Please try again later.</p>';
        }
    }

    function renderOrders(orders) {
        if (orders.length === 0) {
            ordersList.innerHTML = '<p>No orders found.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'orders-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Delivered</th>
                    <th>Shipping Address</th>
                    <th>Phone</th>
                    <th>Items</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');

        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Order ID">${order._id}</td>
                <td data-label="Date">${new Date(order.createdAt).toLocaleDateString()}</td>
                <td data-label="Customer">${order.user ? order.user.name : 'Guest'}</td>
                <td data-label="Total">₹${order.totalPrice.toFixed(2)}</td>
                <td data-label="Paid">${order.isPaid ? 'Yes' : 'No'}</td>
                <td data-label="Delivered">${order.isDelivered ? 'Yes' : 'No'}</td>
                <td data-label="Shipping Address">
                    ${order.shippingAddress.address}, ${order.shippingAddress.city}, 
                    ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}
                </td>
                <td data-label="Phone">${order.shippingAddress.phone}</td>
                <td data-label="Items">
                    <ul>
                        ${order.orderItems.map(item => `<li>${item.name} (x${item.qty})</li>`).join('')}
                    </ul>
                </td>
            `;
            tbody.appendChild(tr);
        });

        ordersList.innerHTML = '';
        ordersList.appendChild(table);
    }

    fetchOrders();
});
