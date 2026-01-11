const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart) {
      return res.json({ items: [], total: 0 });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      // Cart exists for user
      const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

      if (itemIndex > -1) {
        // Product exists in the cart, update the quantity
        let productItem = cart.items[itemIndex];
        productItem.quantity += quantity;
        cart.items[itemIndex] = productItem;
      } else {
        // Product does not exists in cart, add new item
        cart.items.push({ product: productId, quantity });
      }
      cart = await cart.save();
      return res.status(201).send(cart);
    } else {
      // No cart for user, create new cart
      const newCart = await Cart.create({
        user: req.user._id,
        items: [{ product: productId, quantity }]
      });

      return res.status(201).send(newCart);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  const { productId } = req.params;
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(p => p.product.toString() === productId);

    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
      cart = await cart.save();
      res.status(200).send(cart);
    } else {
      res.status(404).json({ message: 'Item not in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCart, addToCart, removeFromCart };
