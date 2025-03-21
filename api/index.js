// api/index.js - Complete API implementation with MongoDB
const { MongoClient, ObjectId } = require('mongodb');
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

// Check if user is admin
async function isAdmin(db, email) {
  // For the MVP, we'll just check if the email contains 'admin'
  return email.includes('admin');
}

// API Routes Handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle OPTIONS request (pre-flight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api', '');

  // Connection test endpoint
  if (path === '/test') {
    try {
      const db = await connectToDatabase();
      return res.status(200).json({ 
        message: 'MongoDB connection successful',
        dbName: db.databaseName
      });
    } catch (error) {
      return res.status(500).json({ 
        message: 'MongoDB connection failed', 
        error: error.message 
      });
    }
  }

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
      
      // Check if user is admin
      const admin = await isAdmin(db, email);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, isAdmin: admin },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.status(200).json({
        token,
        user: {
          email: user.email,
          buybacks: user.buybacks,
          eliminated: user.eliminated,
          isAdmin: admin
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
        
        // Add isAdmin flag
        user.isAdmin = await isAdmin(db, user.email);
        
        return res.status(200).json(user);
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Teams API
    if (path === '/teams' && req.method === 'GET') {
      try {
        verifyToken(req);
        
        // Get day parameter from URL if provided
        const urlParams = new URLSearchParams(url.search);
        const day = urlParams.get('day');
        
        // Create query based on day parameter
        let query = {};
        if (day) {
          query.availableDays = day;
        }
        
        // Get all teams matching the query
        const teams = await db.collection('teams').find(query).toArray();
        
        // If no teams exist yet, create default teams
        if (teams.length === 0 && !day) {
          const defaultTeams = [
            { name: 'Duke', seed: 1, region: 'East', record: '31-3' },
            { name: 'Alabama', seed: 2, region: 'East', record: '25-8' },
            { name: 'Wisconsin', seed: 3, region: 'East', record: '26-9' },
            { name: 'Houston', seed: 1, region: 'South', record: '30-4' },
            { name: 'Tennessee', seed: 2, region: 'South', record: '27-7' },
            { name: 'Florida', seed: 1, region: 'West', record: '30-4' },
            { name: 'St. John\'s', seed: 2, region: 'West', record: '30-4' },
            { name: 'Auburn', seed: 1, region: 'Midwest', record: '28-5' },
            { name: 'Michigan State', seed: 2, region: 'Midwest', record: '27-6' },
            { name: 'Iowa State', seed: 3, region: 'Midwest', record: '24-9' },
            { name: 'Texas A&M', seed: 4, region: 'Midwest', record: '22-10' },
            { name: 'Michigan', seed: 5, region: 'Midwest', record: '25-9' },
            { name: 'Ole Miss', seed: 6, region: 'Midwest', record: '22-11' },
            { name: 'Marquette', seed: 7, region: 'Midwest', record: '23-10' },
            { name: 'Louisville', seed: 8, region: 'Midwest', record: '27-7' },
            { name: 'Creighton', seed: 9, region: 'Midwest', record: '24-10' }
          ];
          
          await db.collection('teams').insertMany(defaultTeams);
          return res.status(200).json({ teams: defaultTeams });
        }
        
        return res.status(200).json({ teams });
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Get available teams for a user
    if (path === '/teams/available' && req.method === 'GET') {
      try {
        const decoded = verifyToken(req);
        
        // Get day parameter from URL if provided
        const urlParams = new URLSearchParams(url.search);
        const day = urlParams.get('day');
        
        // Create query based on day parameter
        let query = {};
        if (day) {
          query.availableDays = day;
        }
        
        // Get all teams matching the day query
        const allTeams = await db.collection('teams').find(query).toArray();
        
        // Get user's previous picks
        const userPicks = await db.collection('picks').find({
          userEmail: decoded.email
        }).toArray();
        
        // Get IDs of teams already used
        const usedTeamIds = [];
        userPicks.forEach(pick => {
          pick.teams.forEach(team => {
            usedTeamIds.push(team._id.toString());
          });
        });
        
        // Filter out used teams
        const availableTeams = allTeams.filter(team => 
          !usedTeamIds.includes(team._id.toString())
        );
        
        return res.status(200).json({ teams: availableTeams });
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Get user's picks
    if (path === '/picks' && req.method === 'GET') {
      try {
        const decoded = verifyToken(req);
        
        // Get user's picks
        const picks = await db.collection('picks').find({
          userEmail: decoded.email
        }).toArray();
        
        return res.status(200).json({ picks });
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Submit new picks
    if (path === '/picks/submit' && req.method === 'POST') {
      try {
        const decoded = verifyToken(req);
        const { teams, day } = req.body;
        
        if (!teams || !day || !Array.isArray(teams)) {
          return res.status(400).json({ message: 'Teams array and day are required' });
        }
        
        // Get current pool settings
        const settings = await db.collection('poolSettings').findOne({}, {
          sort: { _id: -1 }
        });
        
        const requiredPicks = settings ? settings.requiredPicks : 2;
        
        // Validate number of teams
        if (teams.length !== requiredPicks) {
          return res.status(400).json({ 
            message: `You must select exactly ${requiredPicks} teams for ${day}`
          });
        }
        
        // Insert the picks
        const result = await db.collection('picks').insertOne({
          userEmail: decoded.email,
          teams,
          day,
          date: new Date(),
          successful: null // null = pending, true = won, false = lost
        });
        
        return res.status(201).json({ 
          message: 'Picks submitted successfully',
          pickId: result.insertedId
        });
      } catch (error) {
        console.error('Error submitting picks:', error);
        return res.status(error.statusCode || 500).json({ 
          message: 'Failed to submit picks', 
          error: error.message 
        });
      }
    }
    
    // Update existing picks
    if (path === '/picks/update' && req.method === 'PUT') {
      try {
        const decoded = verifyToken(req);
        const { pickId, teams } = req.body;
        
        if (!pickId || !teams || !Array.isArray(teams)) {
          return res.status(400).json({ message: 'Pick ID and teams array are required' });
        }
        
        // Find the pick and verify ownership
        const pick = await db.collection('picks').findOne({
          _id: new ObjectId(pickId)
        });
        
        if (!pick) {
          return res.status(404).json({ message: 'Pick not found' });
        }
        
        if (pick.userEmail !== decoded.email) {
          return res.status(403).json({ message: 'Not authorized to edit this pick' });
        }
        
        // Get current pool settings
        const settings = await db.collection('poolSettings').findOne({}, {
          sort: { _id: -1 }
        });
        
        const requiredPicks = settings ? settings.requiredPicks : 2;
        
        // Validate number of teams
        if (teams.length !== requiredPicks) {
          return res.status(400).json({ 
            message: `You must select exactly ${requiredPicks} teams`
          });
        }
        
        // Update the pick
        await db.collection('picks').updateOne(
          { _id: new ObjectId(pickId) },
          { 
            $set: { 
              teams: teams,
              date: new Date() 
            } 
          }
        );
        
        return res.status(200).json({ message: 'Pick updated successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to update pick', error: error.message });
      }
    }
    
    // Delete a pick
    if (path.startsWith('/picks/delete') && req.method === 'DELETE') {
      try {
        const decoded = verifyToken(req);
        const pickId = path.split('/').pop();
        
        // Find the pick and verify ownership
        const pick = await db.collection('picks').findOne({
          _id: new ObjectId(pickId)
        });
        
        if (!pick) {
          return res.status(404).json({ message: 'Pick not found' });
        }
        
        if (pick.userEmail !== decoded.email && !decoded.isAdmin) {
          return res.status(403).json({ message: 'Not authorized to delete this pick' });
        }
        
        // Delete the pick
        await db.collection('picks').deleteOne({ _id: new ObjectId(pickId) });
        
        return res.status(200).json({ message: 'Pick deleted successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Failed to delete pick', error: error.message });
      }
    }
    
    // ADMIN ROUTES
    
    // Get all users (admin only)
    if (path === '/admin/users' && req.method === 'GET') {
      try {
        const decoded = verifyToken(req);
        
        // Check if user is admin
        const admin = await isAdmin(db, decoded.email);
        if (!admin) {
          return res.status(403).json({ message: 'Admin access required' });
        }
        
        // Get all users
        const users = await db.collection('users').find({}, {
          projection: { password: 0 }
        }).toArray();
        
        return res.status(200).json({ users });
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Get all picks (admin only)
    if (path === '/admin/picks' && req.method === 'GET') {
      try {
        const decoded = verifyToken(req);
        
        // Check if user is admin
        const admin = await isAdmin(db, decoded.email);
        if (!admin) {
          return res.status(403).json({ message: 'Admin access required' });
        }
        
        // Get all picks
        const picks = await db.collection('picks').find({}).toArray();
        
        return res.status(200).json({ picks });
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Get pool settings
    if (path === '/admin/settings' && req.method === 'GET') {
      try {
        verifyToken(req);
        
        // Get the latest settings
        const settings = await db.collection('poolSettings').findOne({}, {
          sort: { _id: -1 }
        });
        
        // If no settings exist yet, return defaults
        if (!settings) {
          return res.status(200).json({
            currentDay: 'Thursday',
            requiredPicks: 2
          });
        }
        
        return res.status(200).json(settings);
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Update pool settings (admin only)
    if (path === '/admin/settings' && req.method === 'PUT') {
      try {
        const decoded = verifyToken(req);
        
        // Check if user is admin
        const admin = await isAdmin(db, decoded.email);
        if (!admin) {
          return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { currentDay, requiredPicks } = req.body;
        
        if (!currentDay || !requiredPicks) {
          return res.status(400).json({ message: 'Current day and required picks are required' });
        }
        
        // Insert new settings (keeping history)
        await db.collection('poolSettings').insertOne({
          currentDay,
          requiredPicks: parseInt(requiredPicks),
          updatedBy: decoded.email,
          updatedAt: new Date()
        });
        
        return res.status(200).json({ message: 'Pool settings updated successfully' });
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    }
    
    // Update team availability by day (admin only)
    if (path === '/admin/team-availability' && req.method === 'POST') {
      try {
        const decoded = verifyToken(req);
        
        // Check if user is admin
        const admin = await isAdmin(db, decoded.email);
        if (!admin) {
          return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { teamDayAvailability } = req.body;
        
        if (!teamDayAvailability) {
          return res.status(400).json({ message: 'Invalid data format' });
        }
        
        console.log('Updating team availability:', teamDayAvailability);
        
        // Get all teams
        const allTeams = await db.collection('teams').find({}).toArray();
        
        // For each team, update its availableDays field
        for (const team of allTeams) {
          const teamId = team._id.toString();
          team.availableDays = [];
          
          // Check each day to see if this team should be available
          for (const day in teamDayAvailability) {
            if (teamDayAvailability[day].includes(teamId)) {
              team.availableDays.push(day);
            }
          }
          
          // Update this team in the database
          await db.collection('teams').updateOne(
            { _id: team._id },
            { $set: { availableDays: team.availableDays } }
          );
        }
        
        return res.status(200).json({ message: 'Team availability updated successfully' });
      } catch (error) {
        console.error('Error updating team availability:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
      }
    }
    
    // Route not found
    return res.status(404).json({ message: 'Not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
