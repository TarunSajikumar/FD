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

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://foodpoint_db:foodpoint_db@foodpint.otnysi6.mongodb.net/";
const API_BASE = '/api';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '1515';
const PORT = process.env.PORT || 3000;

const tokenStore = new Map();

// MongoDB Schemas
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
  status: { type: String, default: 'paid', enum: ['paid', 'unpaid', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);

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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Menu endpoints
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
    const { name, price, description, available } = req.body;
    if (!name || price == null) {
      return res.status(400).json({ error: 'name and price are required' });
    }

    const item = new MenuItem({
      name: String(name),
      price: Number(price),
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
    const { name, price, description, available } = req.body;
    const updates = {};
    if (name != null) updates.name = String(name);
    if (price != null) updates.price = Number(price);
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

// Order endpoints
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
    const { customerName, items, amount, method, provider, status } = req.body;
    if (!customerName || !Array.isArray(items) || items.length === 0 || amount == null) {
      return res.status(400).json({ error: 'customerName, items, and amount are required' });
    }

    // Check if user is authenticated
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
      status: String(status || 'paid')
    });

    await order.save();
    const populatedOrder = await Order.findById(order._id).populate('customerId', 'name email');
    res.status(201).json(populatedOrder);
    io.emit('orderCreated', populatedOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put(`${API_BASE}/orders/:id/status`, requireAuth, requireOwner, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['paid', 'unpaid', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be paid, unpaid, or cancelled' });
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

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

    // Regular user login
    const user = await User.findOne({
      $or: [
        { email: key },
        { name: key }
      ]
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

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({ token, user: safeUser });
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

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
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

    const safeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Socket.IO setup
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

// Initialize database and start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Ensure owner user exists (for backward compatibility)
    const ownerExists = await User.findOne({ email: 'owner@foodpoint.local' });
    if (!ownerExists) {
      const hashedOwnerPassword = await bcrypt.hash(OWNER_PASSWORD, 12);
      const owner = new User({
        name: 'Owner',
        email: 'owner@foodpoint.local',
        password: hashedOwnerPassword,
        role: 'owner'
      });
      await owner.save();
      console.log('Owner user created');
    }

    // Seed initial menu items if empty
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0) {
      const initialMenu = [
        {
          name: 'Classic Burger',
          price: 149.99,
          description: 'Juicy beef burger with lettuce, tomato and house sauce.',
          available: true
        },
        {
          name: 'Paneer Wrap',
          price: 129.99,
          description: 'Spiced paneer wrap with fresh greens and mint chutney.',
          available: true
        },
        {
          name: 'Mango Lassi',
          price: 79.99,
          description: 'Creamy mango lassi with cardamom and honey.',
          available: true
        }
      ];

      await MenuItem.insertMany(initialMenu);
      console.log('Initial menu items seeded');
    }

    server.listen(PORT, () => {
      console.log(`Food Point backend listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
}

start();

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

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.get(`${API_BASE}/menu`, async (req, res) => {
  const menu = await loadJson(MENU_FILE);
  res.json(menu);
});

app.post(`${API_BASE}/menu`, requireAuth, requireOwner, async (req, res) => {
  const { name, price, description, available } = req.body || {};
  if (!name || price == null) {
    return res.status(400).json({ error: 'name and price are required' });
  }

  const menu = await loadJson(MENU_FILE);
  const id = Date.now().toString();
  const item = {
    id,
    name: String(name),
    price: Number(price),
    description: String(description || ''),
    available: available !== false
  };

  menu.push(item);
  await saveJson(MENU_FILE, menu);
  res.status(201).json(item);
});

app.put(`${API_BASE}/menu/:id`, requireAuth, requireOwner, async (req, res) => {
  const id = req.params.id;
  const updates = req.body || {};
  const menu = await loadJson(MENU_FILE);
  const item = menu.find((entry) => String(entry.id) === String(id));
  if (!item) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  if (updates.name != null) item.name = String(updates.name);
  if (updates.price != null) item.price = Number(updates.price);
  if (updates.description != null) item.description = String(updates.description);
  if (updates.available != null) item.available = Boolean(updates.available);

  await saveJson(MENU_FILE, menu);
  res.json(item);
});

app.delete(`${API_BASE}/menu/:id`, requireAuth, requireOwner, async (req, res) => {
  const id = req.params.id;
  let menu = await loadJson(MENU_FILE);
  const itemIndex = menu.findIndex((entry) => String(entry.id) === String(id));
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Menu item not found' });
  }

  const [deleted] = menu.splice(itemIndex, 1);
  await saveJson(MENU_FILE, menu);
  res.json(deleted);
});

app.get(`${API_BASE}/orders`, requireAuth, requireOwner, async (req, res) => {
  const orders = await loadJson(ORDERS_FILE);
  res.json(orders);
});

app.post(`${API_BASE}/orders`, async (req, res) => {
  const { customerName, items, amount, method, provider } = req.body || {};
  if (!customerName || !Array.isArray(items) || items.length === 0 || amount == null) {
    return res.status(400).json({ error: 'customerName, items, and amount are required' });
  }

  const orders = await loadJson(ORDERS_FILE);
  const order = {
    id: Date.now().toString(),
    customerName: String(customerName),
    items: items.map((item) => ({
      name: String(item.name || item.title || ''),
      price: Number(item.price || 0),
      qty: Number(item.qty || item.quantity || 1)
    })),
    amount: Number(amount),
    method: String(method || 'cash'),
    provider: provider || null,
    status: 'paid',
    createdAt: new Date().toISOString()
  };

  orders.push(order);
  await saveJson(ORDERS_FILE, orders);
  res.status(201).json(order);
  io.emit('orderCreated', order);
});

app.post(`${API_BASE}/auth/login`, async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier and password are required' });
  }

  const key = String(identifier).trim().toLowerCase();
  if (key === 'owner') {
    if (String(password) !== OWNER_PASSWORD) {
      return res.status(401).json({ error: 'Invalid owner credentials' });
    }

    const token = generateToken();
    tokenStore.set(token, { id: 'owner', role: 'owner', name: 'Owner' });
    return res.json({ token, user: { id: 'owner', name: 'Owner', role: 'owner' } });
  }

  const users = await loadJson(USERS_FILE);
  const user = users.find((entry) => {
    const email = String(entry.email || '').trim().toLowerCase();
    const name = String(entry.name || '').trim().toLowerCase();
    return key === email || key === name;
  });

  if (!user || String(user.password) !== String(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken();
  tokenStore.set(token, { id: user.id, role: user.role || 'customer', name: user.name, email: user.email });
  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role || 'customer' };
  res.json({ token, user: safeUser });
});

app.post(`${API_BASE}/auth/signup`, async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const users = await loadJson(USERS_FILE);
  if (users.some((entry) => String(entry.email || '').trim().toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = {
    id: Date.now().toString(),
    name: String(name),
    email: normalizedEmail,
    password: String(password),
    role: 'customer'
  };

  users.push(user);
  await saveJson(USERS_FILE, users);

  const token = generateToken();
  tokenStore.set(token, { id: user.id, role: user.role, name: user.name, email: user.email });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

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

async function start() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await ensureFile(USERS_FILE, [
    {
      id: 'owner',
      name: 'Owner',
      email: 'owner@foodpoint.local',
      password: OWNER_PASSWORD,
      role: 'owner'
    }
  ]);
  await ensureFile(MENU_FILE, [
    {
      id: '1',
      name: 'Classic Burger',
      price: 149.99,
      description: 'Juicy beef burger with lettuce, tomato and house sauce.',
      available: true
    },
    {
      id: '2',
      name: 'Paneer Wrap',
      price: 129.99,
      description: 'Spiced paneer wrap with fresh greens and mint chutney.',
      available: true
    },
    {
      id: '3',
      name: 'Mango Lassi',
      price: 79.99,
      description: 'Creamy mango lassi with cardamom and honey.',
      available: true
    }
  ]);
  await ensureFile(ORDERS_FILE, []);

  server.listen(PORT, () => {
    console.log(`Food Point backend listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
