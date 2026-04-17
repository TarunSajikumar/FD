require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://foodpoint_db:foodpoint_db@foodpint.otnysi6.mongodb.net/";
const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';
const API_BASE = '/api';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || '1515';
const PORT = process.env.PORT || 3000;

const tokenStore = new Map();

// Local storage paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const OWNER_SETTINGS_FILE = path.join(DATA_DIR, 'owner-settings.json');

// MongoDB Schemas (only used when not using local storage)
let User, MenuItem, Order;

if (!USE_LOCAL_STORAGE) {
  const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: '' },
    role: { type: String, default: 'customer', enum: ['customer', 'owner'] },
    settings: { type: Object, default: {} },
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

  User = mongoose.model('User', userSchema);
  MenuItem = mongoose.model('MenuItem', menuItemSchema);
  Order = mongoose.model('Order', orderSchema);
}

// Local storage helpers
async function ensureFile(filePath, defaultValue) {
  try {
    await fs.access(filePath);
  } catch (err) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultValue, null, 2));
  }
}

async function loadJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw || '[]');
}

async function saveJson(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
}

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
    if (USE_LOCAL_STORAGE) {
      const menu = await loadJson(MENU_FILE);
      res.json(menu);
    } else {
      const menu = await MenuItem.find({}).sort({ createdAt: -1 });
      res.json(menu);
    }
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

    if (USE_LOCAL_STORAGE) {
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
    } else {
      const item = new MenuItem({
        name: String(name),
        price: Number(price),
        description: String(description || ''),
        available: available !== false
      });
      await item.save();
      res.status(201).json(item);
    }
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

    if (USE_LOCAL_STORAGE) {
      const menu = await loadJson(MENU_FILE);
      const item = menu.find((entry) => String(entry.id) === req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      Object.assign(item, updates);
      await saveJson(MENU_FILE, menu);
      res.json(item);
    } else {
      const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

app.delete(`${API_BASE}/menu/:id`, requireAuth, requireOwner, async (req, res) => {
  try {
    if (USE_LOCAL_STORAGE) {
      let menu = await loadJson(MENU_FILE);
      const itemIndex = menu.findIndex((entry) => String(entry.id) === req.params.id);
      if (itemIndex === -1) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      const [deleted] = menu.splice(itemIndex, 1);
      await saveJson(MENU_FILE, menu);
      res.json(deleted);
    } else {
      const item = await MenuItem.findByIdAndDelete(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      res.json(item);
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// Order endpoints
app.get(`${API_BASE}/orders`, requireAuth, async (req, res) => {
  try {
    if (USE_LOCAL_STORAGE) {
      const orders = await loadJson(ORDERS_FILE);
      // Filter orders based on user role
      let filteredOrders = orders;
      if (req.user.role !== 'owner') {
        // For local storage, we don't have customerId, so return all for now
        // In a real implementation, you'd need to track user orders differently
        filteredOrders = orders;
      }
      res.json(filteredOrders);
    } else {
      let query = {};
      if (req.user.role !== 'owner') {
        query.customerId = req.user.id;
      }

      const orders = await Order.find(query)
        .populate('customerId', 'name email')
        .sort({ createdAt: -1 });

      res.json(orders);
    }
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

    if (USE_LOCAL_STORAGE) {
      const orders = await loadJson(ORDERS_FILE);
      const order = {
        id: Date.now().toString(),
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
        createdAt: new Date().toISOString()
      };
      orders.push(order);
      await saveJson(ORDERS_FILE, orders);
      res.status(201).json(order);
      io.emit('orderCreated', order);
    } else {
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
    }
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

    if (USE_LOCAL_STORAGE) {
      const orders = await loadJson(ORDERS_FILE);
      const order = orders.find((entry) => String(entry.id) === req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      order.status = status;
      await saveJson(ORDERS_FILE, orders);
      res.json(order);
      io.emit('orderUpdated', order);
    } else {
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
    }
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

// ====== OWNER UPI SETTINGS ENDPOINTS ======

// Get owner UPI settings
app.get(`${API_BASE}/owner/upi-settings`, requireAuth, requireOwner, async (req, res) => {
  try {
    let settings = {
      restaurantName: 'Food Point',
      upiId: '',
      accountHolderName: '',
      parcelCharge: 5
    };

    if (USE_LOCAL_STORAGE) {
      try {
        const fileSettings = await loadJson(OWNER_SETTINGS_FILE);
        if (fileSettings) {
          settings = { ...settings, ...fileSettings };
        }
      } catch (err) {
        // File doesn't exist yet, return defaults
      }
    } else {
      // MongoDB: Try to get from owner user document
      const owner = await User.findOne({ role: 'owner' });
      if (owner && owner.settings) {
        settings = { ...settings, ...owner.settings };
      }
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching owner settings:', error);
    res.status(500).json({ error: 'Failed to fetch owner settings' });
  }
});

// Update owner UPI settings
app.put(`${API_BASE}/owner/upi-settings`, requireAuth, requireOwner, async (req, res) => {
  try {
    const { restaurantName, upiId, accountHolderName, parcelCharge } = req.body;

    const settings = {
      restaurantName: restaurantName || 'Food Point',
      upiId: upiId || '',
      accountHolderName: accountHolderName || '',
      parcelCharge: parcelCharge || 5,
      updatedAt: new Date().toISOString()
    };

    if (USE_LOCAL_STORAGE) {
      await saveJson(OWNER_SETTINGS_FILE, settings);
    } else {
      // MongoDB: Update owner user document
      const owner = await User.findOne({ role: 'owner' });
      if (owner) {
        owner.settings = settings;
        await owner.save();
      }
    }

    res.json({
      message: 'Owner settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating owner settings:', error);
    res.status(500).json({ error: 'Failed to update owner settings' });
  }
});

// Get owner UPI QR code data
app.get(`${API_BASE}/owner/upi-qr`, requireAuth, requireOwner, async (req, res) => {
  try {
    const { amount } = req.query;

    let settings = {
      restaurantName: 'Food Point',
      upiId: '',
      accountHolderName: ''
    };

    if (USE_LOCAL_STORAGE) {
      try {
        const fileSettings = await loadJson(OWNER_SETTINGS_FILE);
        if (fileSettings) {
          settings = { ...settings, ...fileSettings };
        }
      } catch (err) {
        // File doesn't exist yet, return defaults
      }
    } else {
      // MongoDB: Get from owner user document
      const owner = await User.findOne({ role: 'owner' });
      if (owner && owner.settings) {
        settings = { ...settings, ...owner.settings };
      }
    }

    // Generate UPI URL
    const numericAmount = parseFloat(String(amount || 0).replace(/[₹, ]+/g, '')) || 0;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.restaurantName)}&am=${numericAmount.toFixed(2)}&cu=INR`;

    res.json({
      upiId: settings.upiId,
      restaurantName: settings.restaurantName,
      accountHolderName: settings.accountHolderName,
      amount: numericAmount.toFixed(2),
      upiUrl: upiUrl,
      qrData: upiUrl // QR code text/data
    });
  } catch (error) {
    console.error('Error generating QR data:', error);
    res.status(500).json({ error: 'Failed to generate QR code data' });
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

    if (USE_LOCAL_STORAGE) {
      const users = await loadJson(USERS_FILE);
      const user = users.find(u =>
        u.email === key || u.name.toLowerCase() === key
      );

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken();
      tokenStore.set(token, {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      });

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.json({ token, user: safeUser });
    } else {
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
    }
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

    if (USE_LOCAL_STORAGE) {
      const users = await loadJson(USERS_FILE);
      const existingUser = users.find(u => u.email === normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = {
        id: Date.now().toString(),
        name: String(name),
        email: normalizedEmail,
        password: hashedPassword,
        plainPassword: String(password),
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      await saveJson(USERS_FILE, users);

      const token = generateToken();
      tokenStore.set(token, {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      });

      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };

      res.status(201).json({ token, user: safeUser });
    } else {
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
        plainPassword: String(password),
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
    }
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
    if (!USE_LOCAL_STORAGE) {
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
    } else {
      console.log('Using local storage mode');

      // Initialize local storage files
      await ensureFile(USERS_FILE, []);
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
      await ensureFile(OWNER_SETTINGS_FILE, {
        restaurantName: 'Food Point',
        upiId: 'foodpoint@okicici',
        accountHolderName: 'Food Point',
        parcelCharge: 5
      });
      console.log('Local storage files initialized');
    }

    server.listen(PORT, () => {
      console.log(`Food Point backend listening on http://localhost:${PORT}`);
      console.log(`Storage mode: ${USE_LOCAL_STORAGE ? 'Local Files' : 'MongoDB'}`);
      console.log(`API base: ${API_BASE}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    if (error.message.includes('ECONNREFUSED') || error.message.includes('authentication failed')) {
      console.log('\n💡 MongoDB connection failed. To use local storage instead:');
      console.log('   Set USE_LOCAL_STORAGE=true in your .env file');
      console.log('   Then restart the server');
    }
    process.exit(1);
  }
}

start();
