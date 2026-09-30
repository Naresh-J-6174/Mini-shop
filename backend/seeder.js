import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';

await connectDB();

const importData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      isApproved: true
    });

    const sellerOne = await User.create({
      name: 'Ravi Kumar',
      email: 'seller1@example.com',
      password: 'seller123',
      role: 'seller',
      shopName: 'Ravi Electronics',
      isApproved: true // pre-approved so you can see approved products immediately
    });

    const sellerTwo = await User.create({
      name: 'Priya Shah',
      email: 'seller2@example.com',
      password: 'seller123',
      role: 'seller',
      shopName: 'Priya Fashion Hub'
      // left unapproved on purpose, so you can test the admin approval flow
    });

    const buyer = await User.create({
      name: 'Test Buyer',
      email: 'buyer@example.com',
      password: 'buyer123',
      role: 'buyer'
    });

    const products = [
      {
        seller: sellerOne._id,
        name: 'Wireless Bluetooth Headphones',
        image: 'https://placehold.co/500x500/4f46e5/ffffff?text=Wireless+Headphones&font=poppins',
        description: 'Over-ear wireless headphones with noise cancellation and 30hr battery life.',
        category: 'Electronics',
        price: 2499,
        countInStock: 25,
        isApproved: true
      },
      {
        seller: sellerOne._id,
        name: 'Smart Fitness Watch',
        image: 'https://placehold.co/500x500/4f46e5/ffffff?text=Fitness+Watch&font=poppins',
        description: 'Track your steps, heart rate, and sleep with this sleek fitness watch.',
        category: 'Electronics',
        price: 1899,
        countInStock: 40,
        isApproved: true
      },
      {
        seller: sellerOne._id,
        name: 'Portable Bluetooth Speaker',
        image: 'https://placehold.co/500x500/4f46e5/ffffff?text=Bluetooth+Speaker&font=poppins',
        description: 'Compact speaker with rich bass, waterproof design, 12hr playtime.',
        category: 'Electronics',
        price: 1299,
        countInStock: 15,
        isApproved: true
      },
      {
        seller: sellerTwo._id,
        name: "Men's Casual Sneakers",
        image: 'https://placehold.co/500x500/db2777/ffffff?text=Casual+Sneakers&font=poppins',
        description: 'Comfortable everyday sneakers with breathable mesh fabric.',
        category: 'Fashion',
        price: 1599,
        countInStock: 30,
        isApproved: true // seller2's account itself is still pending admin approval, for that demo
      },
      {
        seller: sellerTwo._id,
        name: "Women's Handbag",
        image: 'https://placehold.co/500x500/db2777/ffffff?text=Women%27s+Handbag&font=poppins',
        description: 'Stylish faux-leather handbag with multiple compartments.',
        category: 'Fashion',
        price: 999,
        countInStock: 20,
        isApproved: true
      },
      {
        seller: sellerOne._id,
        name: 'Mechanical Gaming Keyboard',
        image: 'https://placehold.co/500x500/4f46e5/ffffff?text=Gaming+Keyboard&font=poppins',
        description: 'RGB backlit mechanical keyboard with blue switches.',
        category: 'Electronics',
        price: 2199,
        countInStock: 18,
        isApproved: true
      },
      {
        seller: sellerOne._id,
        name: 'Ceramic Coffee Mug Set',
        image: 'https://placehold.co/500x500/d97706/ffffff?text=Coffee+Mug+Set&font=poppins',
        description: 'Set of 4 ceramic mugs, microwave and dishwasher safe.',
        category: 'Home',
        price: 699,
        countInStock: 50,
        isApproved: true
      },
      {
        seller: sellerOne._id,
        name: 'Yoga Mat with Carry Strap',
        image: 'https://placehold.co/500x500/16a34a/ffffff?text=Yoga+Mat&font=poppins',
        description: 'Non-slip 6mm thick yoga mat, includes carry strap.',
        category: 'Sports',
        price: 899,
        countInStock: 35,
        isApproved: true
      }
    ];

    await Product.insertMany(products);

    console.log('=================================');
    console.log('Data Imported Successfully!');
    console.log('=================================');
    console.log('Login credentials:');
    console.log(`  Admin   -> admin@example.com / admin123`);
    console.log(`  Seller1 (approved)   -> seller1@example.com / seller123`);
    console.log(`  Seller2 (pending)    -> seller2@example.com / seller123`);
    console.log(`  Buyer   -> buyer@example.com / buyer123`);
    console.log('=================================');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
