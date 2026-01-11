require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const products = [
  {
    name: 'Pink Flower',
    description: 'Beautiful handmade pink flower made with love',
    price: 199,
    image: 'assets/p1.jpeg',
    category: 'Flower',
    inStock: true
  },
  {
    name: 'Bear Keychain',
    description: 'Adorable bear keychain - perfect for keys or bags',
    price: 249,
    image: 'assets/p2.jpeg',
    category: 'Keychain',
    inStock: true
  },
  {
    name: 'Flower Bouquet',
    description: 'Colorful flower bouquet - a perfect gift',
    price: 299,
    image: 'assets/p3.jpeg',
    category: 'Bouquet',
    inStock: true
  },
  {
    name: 'Custom Gift',
    description: 'Custom made gift - personalize your order',
    price: 349,
    image: 'assets/p5.jpeg',
    category: 'Gift',
    inStock: true
  },
  {
    name: 'Colorful Tulips',
    description: 'Beautiful colorful tulips arrangement',
    price: 399,
    image: 'assets/p6.jpeg',
    category: 'Flower',
    inStock: true
  }
];

const seedProducts = async () => {
  try {
    // Wait for connection
    if (mongoose.connection.readyState === 0) {
      await new Promise((resolve) => {
        mongoose.connection.once('open', resolve);
      });
    }
    
    console.log('Database connected!');
    await Product.deleteMany({});
    console.log('Deleted existing products');
    await Product.insertMany(products);
    console.log(`✅ Products seeded successfully! (${products.length} products)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    process.exit(1);
  }
};

// Run after a short delay to ensure connection
setTimeout(seedProducts, 2000);
