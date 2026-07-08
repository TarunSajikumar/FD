require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://foodpoint_db:foodpointby1515@foodpint.otnysi6.mongodb.net/foodpoint?retryWrites=true&w=majority";
const API_BASE = '/api';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '1515';
const PORT = process.env.PORT || 3000;

const tokenStore = new Map();

// ─── MongoDB Schemas ──────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer', enum: ['customer', 'owner'] },
  createdAt: { type: Date, default: Date.now }
});

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, default: 'Uncategorized' },
  description: { type: String, default: '' },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, default: 1 }
  }],
  amount: { type: Number, required: true },
  method: { type: String, default: 'cash' },
  provider: { type: String },
  status: { type: String, default: 'new', enum: ['paid', 'unpaid', 'cancelled', 'completed', 'pending', 'new'] },
  parcelSelected: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const shopSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});

const User = mongoose.model('User', userSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);
const ShopSetting = mongoose.model('ShopSetting', shopSettingSchema);

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

function generateToken() {
  return crypto.randomBytes(24).toString('hex');
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.slice(7);
  const session = tokenStore.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = session;
  next();
}

function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── Menu Endpoints ───────────────────────────────────────────────────────────

app.get(`${API_BASE}/menu`, async (req, res) => {
  try {
    const menu = await MenuItem.find({}).sort({ createdAt: -1 });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.post(`${API_BASE}/menu`, requireAuth, requireOwner, async (req, res) => {
  try {
    const { name, price, category, description, available } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const item = new MenuItem({
      name: String(name),
      price: Number(price),
      category: String(category || 'Uncategorized'),
      description: String(description || ''),
      available: available !== false
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

app.put(`${API_BASE}/menu/:id`, requireAuth, requireOwner, async (req, res) => {
  try {
    const { name, price, category, description, available } = req.body;
    const updates = {};
    if (name != null) updates.name = String(name);
    if (price != null) updates.price = Number(price);
    if (category != null) updates.category = String(category);
    if (description != null) updates.description = String(description);
    if (available != null) updates.available = Boolean(available);

    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

app.delete(`${API_BASE}/menu/:id`, requireAuth, requireOwner, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// ─── Order Endpoints ──────────────────────────────────────────────────────────

app.get(`${API_BASE}/orders`, requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'owner') {
      query.customerId = req.user.id;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post(`${API_BASE}/orders`, async (req, res) => {
  try {
    const shopSetting = await ShopSetting.findOne({ key: 'shopStatus' });
    if (shopSetting && shopSetting.value === 'closed') {
      return res.status(400).json({ error: 'Shop is currently closed' });
    }

    const { customerName, items, amount, method, provider, status } = req.body;
    if (!customerName || !Array.isArray(items) || items.length === 0 || amount == null) {
      return res.status(400).json({ error: 'customerName, items, and amount are required' });
    }

    // Resolve customerId from auth header if present
    let customerId = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const session = tokenStore.get(token);
      if (session && session.role === 'customer') {
        customerId = session.id;
      }
    }

    const order = new Order({
      customerId,
      customerName: String(customerName),
      items: items.map(item => ({
        name: String(item.name || item.title || ''),
        price: Number(item.price || 0),
        qty: Number(item.qty || item.quantity || 1)
      })),
      amount: Number(amount),
      method: String(method || 'cash'),
      provider: provider || null,
      status: String(status || 'paid'),
      parcelSelected: Boolean(req.body.parcelSelected)
    });

    await order.save();
    const populatedOrder = await Order.findById(order._id).populate('customerId', 'name email');
    res.status(201).json(populatedOrder);
    io.emit('orderCreated', populatedOrder);
    if (populatedOrder.status === 'paid') {
      io.emit('paymentReceived', populatedOrder);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put(`${API_BASE}/orders/:id/status`, requireAuth, requireOwner, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid', 'unpaid', 'cancelled', 'completed', 'pending', 'new'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be paid, unpaid, cancelled, completed, pending, or new' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('customerId', 'name email');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
    io.emit('orderUpdated', order);
    if (status === 'paid') {
      io.emit('paymentReceived', order);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ─── User Profile ─────────────────────────────────────────────────────────────

app.get(`${API_BASE}/user/profile`, requireAuth, async (req, res) => {
  try {
    if (req.user.role === 'owner') {
      return res.status(403).json({ error: 'Owner profile not available via this endpoint' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orders = await Order.find({ customerId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      orders
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── Auth Endpoints ───────────────────────────────────────────────────────────

app.post(`${API_BASE}/auth/login`, async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'identifier and password are required' });
    }

    const key = String(identifier).trim().toLowerCase();

    // Special owner login
    if (key === 'owner') {
      if (String(password) !== OWNER_PASSWORD) {
        return res.status(401).json({ error: 'Invalid owner credentials' });
      }

      const token = generateToken();
      tokenStore.set(token, { id: 'owner', role: 'owner', name: 'Owner' });
      return res.json({ token, user: { id: 'owner', name: 'Owner', role: 'owner' } });
    }

    // Regular user login via MongoDB
    const user = await User.findOne({
      $or: [{ email: key }, { name: key }]
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken();
    tokenStore.set(token, {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email
    });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post(`${API_BASE}/auth/signup`, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      name: String(name),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'customer'
    });

    await user.save();

    const token = generateToken();
    tokenStore.set(token, {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email
    });

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ─── Shop Status Endpoints ────────────────────────────────────────────────────

app.get(`${API_BASE}/shop/status`, async (req, res) => {
  try {
    const setting = await ShopSetting.findOne({ key: 'shopStatus' });
    res.json({ status: setting ? setting.value : 'open' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shop status' });
  }
});

app.put(`${API_BASE}/shop/status`, requireAuth, requireOwner, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['open', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be open or closed' });
    }

    await ShopSetting.findOneAndUpdate(
      { key: 'shopStatus' },
      { key: 'shopStatus', value: status },
      { upsert: true, new: true }
    );

    res.json({ status });
    io.emit('shopStatusChanged', { status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shop status' });
  }
});

// ─── Analytics / Dashboard Endpoint ──────────────────────────────────────────

app.get(`${API_BASE}/dashboard`, requireAuth, requireOwner, async (req, res) => {
  try {
    const orders = await Order.find({});
    
    const todayStr = new Date().toLocaleDateString("en-IN");
    const yesterdayStr = new Date(Date.now() - 86400000).toLocaleDateString("en-IN");
    
    let totalOrders = 0;
    let totalRevenue = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    let yesterdayOrders = 0;
    let yesterdayRevenue = 0;
    let cashCount = 0;
    let onlineCount = 0;

    orders.forEach(order => {
      totalOrders++;
      
      const amount = Number(order.amount) || 0;
      totalRevenue += amount;

      const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN");
      if (orderDate === todayStr) {
        todayOrders++;
        todayRevenue += amount;
      } else if (orderDate === yesterdayStr) {
        yesterdayOrders++;
        yesterdayRevenue += amount;
      }

      if (order.method === 'cash') {
        cashCount++;
      } else if (order.method === 'online') {
        onlineCount++;
      }
    });

    res.json({
      totalOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      yesterdayOrders,
      yesterdayRevenue,
      cashCount,
      onlineCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token && tokenStore.has(token)) {
    socket.user = tokenStore.get(token);
  }
  next();
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, socket.user ? socket.user.name : 'anonymous');
});

// ─── Start Server ─────────────────────────────────────────────────────────────

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Ensure owner user exists
    const ownerExists = await User.findOne({ email: 'owner@foodpoint.local' });
    if (!ownerExists) {
      const hashedOwnerPassword = await bcrypt.hash(OWNER_PASSWORD, 12);
      await new User({
        name: 'Owner',
        email: 'owner@foodpoint.local',
        password: hashedOwnerPassword,
        role: 'owner'
      }).save();
      console.log('Owner user created');
    }

    // Seed initial menu if empty
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      await MenuItem.insertMany([
        { name: 'Chicken Dum Biryani', price: 100, category: '🍛 BIRYANI', description: 'Aromatic basmati rice with tender chicken', available: true },
        { name: 'Chicken Fry Biryani', price: 90, category: '🍛 BIRYANI', description: 'Fried chicken pieces with flavorful rice', available: true },
        { name: 'Egg Biryani', price: 90, category: '🍛 BIRYANI', description: 'Boiled eggs with spiced rice', available: true },
        { name: 'Veg Momo (Steam)', price: 60, category: '🥟 MOMO', description: 'Steamed vegetable dumplings', available: true },
        { name: 'Chicken Momo (Steam)', price: 70, category: '🥟 MOMO', description: 'Steamed chicken dumplings', available: true },
        { name: 'Chilli Chicken', price: 120, category: '🍗 CHINESE NON-VEG DRY ITEMS', description: 'Spicy indo-chinese chicken', available: true },
        { name: 'Veg Noodles', price: 50, category: '🍜 NOODLES', description: 'Mixed vegetable noodles', available: true },
        { name: 'Chicken Noodles', price: 90, category: '🍜 NOODLES', description: 'Chicken flavored noodles', available: true },
        { name: 'Paneer Butter Masala', price: 140, category: '🍲 CURRY ITEMS – VEG', description: 'Paneer in creamy tomato gravy', available: true },
        { name: 'Butter Chicken', price: 180, category: '🍛 CURRY ITEMS – NON-VEG', description: 'Creamy butter chicken', available: true },
        { name: 'Veg Fried Rice', price: 50, category: '🍚 RICE ITEMS – VEG', description: 'Mixed vegetable fried rice', available: true },
        { name: 'Chicken Fried Rice', price: 90, category: '🍗 RICE ITEMS – NON-VEG', description: 'Chicken fried rice', available: true }
      ]);
      console.log('Initial menu items seeded');
    }

    server.listen(PORT, () => {
      console.log(`🚀 Food Point backend listening on http://localhost:${PORT}`);
      console.log(`📦 Storage: MongoDB Atlas`);
      console.log(`🔗 API base: ${API_BASE}`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error.message);
    process.exit(1);
  }
}

start();
