const Order = require('../models/Order');
const Product = require('../models/Product');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400).json({ message: 'No order items' });
    return;
  }

  try {
    // Convert product IDs to ObjectIds and validate products exist
    const processedOrderItems = await Promise.all(
      orderItems.map(async (item) => {
        let productId = item.product;
        
        // If product is a string (from frontend), try to find the product
        if (typeof productId === 'string') {
          // Try to find product by ID (if it's already an ObjectId string)
          if (mongoose.Types.ObjectId.isValid(productId)) {
            productId = new mongoose.Types.ObjectId(productId);
          } else {
            // If it's not a valid ObjectId, try to find by name or use a default
            // For now, we'll create a temporary ObjectId or use name lookup
            // This handles the case where frontend uses simple IDs like "1", "2", "3"
            const product = await Product.findOne({ name: item.name });
            if (product) {
              productId = product._id;
            } else {
              // If product not found by name, create a new ObjectId
              // In production, you'd want better error handling
              productId = new mongoose.Types.ObjectId();
            }
          }
        }
        
        return {
          name: item.name,
          qty: item.qty || item.quantity,
          price: item.price,
          image: item.image,
          product: productId
        };
      })
    );

    const order = new Order({
      orderItems: processedOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Create Razorpay order
    const options = {
      amount: totalPrice * 100, // amount in the smallest currency unit
      currency: "INR",
      receipt: createdOrder._id,
    };
    const razorpayOrder = await razorpay.orders.create(options);
    
    res.status(201).json({ createdOrder, razorpayOrder });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
  // Here you would verify the payment signature from Razorpay
  // For simplicity, we will just mark the order as paid
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };

      const updatedOrder = await order.save();

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = req.body.isPaid === true || order.isPaid;
      if(order.isPaid && !order.paidAt) {
          order.paidAt = Date.now();
      }
      order.isDelivered = req.body.isDelivered === true || order.isDelivered;
      if(order.isDelivered && !order.deliveredAt) {
          order.deliveredAt = Date.now();
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createOrder,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderStatus,
};
