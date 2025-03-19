// Serverless API for March Madness Knockout Pool
const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db('march-madness-pool');
  cachedDb = db;
  return db;
}

// Helper function to verify JWT token
function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// API Routes Handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request (pre-flight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '');

  try {
    const db = await connectToDatabase();

    // User registration
    if (path === '/register' && req.method === 'POST') {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
      
      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.collection('users').insertOne({
        email,
        password: hashedPassword,
        buybacks: 0,
        eliminated: false,
        createdAt: new Date()
      });
      
      return res.status(201).json({ message: 'User registered successfully' });
    }
    
    // User login
    if (path === '/login' && req.method === 'POST') {
      const { email, password } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Find user
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.status(200).json({
        token,
        user: {
          email: user.email,
          buybacks: user.buybacks,
          eliminated: user.eliminated
        }
      });
    }
    
    // Get current user
    if (path === '/user' && req.method === 'GET') {
      try {
        const decoded = verifyToken(req);
        const user = await db.collection('users').findOne(
          { email: decoded.email },
          { projection: { password: 0 } }
        );
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json(user);
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Get or submit picks
    if (path.startsWith('/picks')) {
      try {
        const decoded = verifyToken(req);
        
        // Get user's picks
        if (req.method === 'GET') {
          const picks = await db.collection('picks').find({
            userEmail: decoded.email
          }).toArray();
          
          return res.status(200).json({ picks });
        }
        
        // Submit picks
        if (req.method === 'POST') {
          const { teams, day } = req.body;
          
          if (!teams || !day) {
            return res.status(400).json({ message: 'Teams and day are required' });
          }
          
          // Validate team selection
          // In a real app, you'd verify teams are available and valid
          
          // Save picks
          await db.collection('picks').insertOne({
            userEmail: decoded.email,
            teams,
            day,
            date: new Date(),
            successful: null // null = pending, true = won, false = lost
          });
          
          return res.status(201).json({ message: 'Picks submitted successfully' });
        }
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Route not found
    return res.status(404).json({ message: 'Not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
