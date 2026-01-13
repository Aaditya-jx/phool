document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const ordersList = document.getElementById('orders-list');
    const recentOrdersList = document.getElementById('recent-orders-list');
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalOrdersEl = document.getElementById('total-orders');
    const totalCustomersEl = document.getElementById('total-customers');
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const statusModal = document.getElementById('status-modal');
    const updateStatusForm = document.getElementById('update-status-form');
    const modalError = document.getElementById('modal-error');
    
    const user = getCurrentUser();
    let allOrders = []; // Cache all orders
    let currentOrderId = null; // To track the order being updated

    // Page Protection: Redirect if not logged in or not an admin
    if (!isAuthenticated() || !user || !user.isAdmin) {
        alert('Access denied. You must be an admin to view this page.');
        window.location.href = 'index.html';
        return;
    }

    // --- Data Fetching ---
    async function fetchAllOrders() {
        try {
            const orders = await apiRequest(getAPIUrl(API_CONFIG.endpoints.orders), {
                method: 'GET'
            });
            allOrders = orders;
            
            // Initial render
            updateDashboardSummary(allOrders);
            renderAllOrders(allOrders);
            renderRecentOrders(allOrders);

        } catch (error) {
            console.error('Failed to fetch orders:', error);
            ordersList.innerHTML = '<p class="error-message">Failed to load orders. Please try again later.</p>';
        }
    }

    // --- Dashboard Summary ---
    function updateDashboardSummary(orders) {
        totalRevenueEl.textContent = `₹${orders.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}`;
        totalOrdersEl.textContent = orders.length;
        const customerIds = new Set(orders.map(o => o.user ? o.user._id : null).filter(id => id));
        totalCustomersEl.textContent = customerIds.size;
    }

    // --- Order Rendering ---
    function renderAllOrders(orders) {
        renderTable(ordersList, orders, 'orders-table');
    }

    function renderRecentOrders(orders) {
        const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
        renderTable(recentOrdersList, recent, 'recent-orders-table');
    }

    function renderTable(container, orders, tableClass) {
        if (orders.length === 0) {
            container.innerHTML = `<p>No orders found.</p>`;
            return;
        }
        container.innerHTML = '';
        container.appendChild(createOrdersTable(orders, tableClass));
    }

    // --- Search and Filter ---
    function handleSearchAndFilter() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusFilter = filterStatus.value;

        const filteredOrders = allOrders.filter(order => {
            const customerName = (order.user ? order.user.name : 'Guest').toLowerCase();
            const orderId = order._id.toLowerCase();
            
            const matchesSearch = customerName.includes(searchTerm) || orderId.includes(searchTerm);

            if (!statusFilter) return matchesSearch;

            let matchesStatus = false;
            if (statusFilter === 'Paid') matchesStatus = order.isPaid && !order.isDelivered;
            else if (statusFilter === 'Not Paid') matchesStatus = !order.isPaid;
            else if (statusFilter === 'Delivered') matchesStatus = order.isDelivered;

            return matchesSearch && matchesStatus;
        });
        renderAllOrders(filteredOrders);
    }

    // --- Update Status Modal Logic ---
    window.openUpdateStatusModal = (orderId) => {
        currentOrderId = orderId;
        const order = allOrders.find(o => o._id === orderId);
        if (!order) return;

        document.getElementById('modal-order-id').textContent = order._id;
        document.getElementById('modal-is-paid').value = String(order.isPaid);
        document.getElementById('modal-is-delivered').value = String(order.isDelivered);
        
        modalError.style.display = 'none';
        statusModal.classList.remove('hidden');
    };

    window.closeUpdateStatusModal = () => {
        statusModal.classList.add('hidden');
        currentOrderId = null;
    };

    async function handleStatusUpdate(e) {
        e.preventDefault();
        if (!currentOrderId) return;

        const isPaid = document.getElementById('modal-is-paid').value === 'true';
        const isDelivered = document.getElementById('modal-is-delivered').value === 'true';
        
        try {
            const updatedOrder = await apiRequest(`${getAPIUrl(API_CONFIG.endpoints.orders)}/${currentOrderId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ isPaid, isDelivered })
            });
            
            // Update local order cache
            const orderIndex = allOrders.findIndex(o => o._id === currentOrderId);
            if(orderIndex > -1) {
                allOrders[orderIndex] = updatedOrder;
            }

            // Re-render everything to reflect changes
            handleSearchAndFilter(); // This will re-render the main table
            renderRecentOrders(allOrders);
            updateDashboardSummary(allOrders);

            closeUpdateStatusModal();

        } catch (error) {
            console.error('Failed to update order status:', error);
            modalError.textContent = 'Failed to update status. Please try again.';
            modalError.style.display = 'block';
        }
    }

    // --- Helper function to create a table ---
    function createOrdersTable(orders, tableClass) {
        const table = document.createElement('table');
        table.className = tableClass;
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');

        orders.forEach(order => {
            const tr = document.createElement('tr');
            
            let status = '<span class="status-unpaid">Not Paid</span>';
            if (order.isDelivered) status = '<span class="status-delivered">Delivered</span>';
            else if (order.isPaid) status = '<span class="status-paid">Paid</span>';

            tr.innerHTML = `
                <td data-label="Order ID">${order._id}</td>
                <td data-label="Date">${new Date(order.createdAt).toLocaleDateString()}</td>
                <td data-label="Customer">${order.user ? order.user.name : 'Guest'}</td>
                <td data-label="Total">₹${order.totalPrice.toFixed(2)}</td>
                <td data-label="Status">${status}</td>
                <td data-label="Items">
                    <ul>${order.orderItems.map(item => `<li>${item.name} (x${item.qty})</li>`).join('')}</ul>
                </td>
                <td data-label="Actions">
                    <button class="btn btn-secondary" onclick="openUpdateStatusModal('${order._id}')">Update</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        return table;
    }

    // --- Event Listeners ---
    searchInput.addEventListener('input', handleSearchAndFilter);
    filterStatus.addEventListener('change', handleSearchAndFilter);
    updateStatusForm.addEventListener('submit', handleStatusUpdate);

    // Initial fetch
    fetchAllOrders();
});
