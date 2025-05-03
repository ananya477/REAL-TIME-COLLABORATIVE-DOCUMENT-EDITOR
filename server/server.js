const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import models
const Document = require('./models/Document');
const User = require('./models/User');

// Initialize Express app
const app = express();
const server = http.createServer(app);
// Update CORS configuration to include DELETE method
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"]  // Added DELETE
    }
});

// Update CORS middleware
// Move express.json middleware to the top
app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Update the delete route
app.delete('/api/documents/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        jwt.verify(token, 'your-secret-key');
        const { id } = req.params;
        
        const document = await Document.findById(id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        await Document.findByIdAndDelete(id);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// Remove all other DELETE route handlers

// Move logging middleware here, before routes
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

mongoose.connect('mongodb://127.0.0.1:27017/document-editor', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Database: document-editor');
}).catch((err) => {
    console.error('MongoDB connection error details:', {
        message: err.message,
        code: err.code
    });
});

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Apply token verification to document routes
app.get('/api/documents', verifyToken, async (req, res) => {
    try {
        const documents = await Document.find().sort({ lastModified: -1 });
        console.log('Documents found:', documents.length);
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Error fetching documents' });
    }
});

// Remove this duplicate DELETE route (around line 28-52)
// app.delete('/api/documents/:id', async (req, res) => { ... });

// Keep only this version of the DELETE route with proper token verification
app.delete('/api/documents/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Attempting to delete document:', id);
        
        // Add user verification
        const document = await Document.findById(id);
        if (!document) {
            console.log('Document not found:', id);
            return res.status(404).json({ error: 'Document not found' });
        }

        // Perform the deletion
        await Document.findByIdAndDelete(id);
        
        console.log('Document deleted successfully:', id);
        io.emit('documentDeleted', id); // Notify all clients
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});
app.get('/api/documents/:id', async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }
        res.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Error fetching document' });
    }
});

app.post('/api/documents', async (req, res) => {
    try {
        const document = new Document({
            title: 'Untitled Document',
            content: '',
            lastModified: new Date()
        });
        const savedDoc = await document.save();
        console.log('Document created:', savedDoc);
        res.json(savedDoc);
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Error creating document' });
    }
});

// Keep only one PUT route handler and remove the duplicate
app.put('/api/documents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        
        // Validate input
        if (!title && !content) {
            return res.status(400).json({ error: 'Title or content is required' });
        }

        const document = await Document.findByIdAndUpdate(
            id,
            { 
                title: title || 'Untitled Document',
                content: content || '',
                lastModified: new Date() 
            },
            { new: true, runValidators: true }
        );

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Error updating document' });
    }
});

// Remove the duplicate strictQuery setting from the bottom of the file

// Change the port number
const PORT = process.env.PORT || 5002;  // Changed from 5001 to 5002

server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please try a different port.`);
        process.exit(1);
    }
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('Registration attempt:', { username, email });

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.trim() }
            ]
        });

        if (existingUser) {
            console.log('User already exists:', existingUser.email);
            return res.status(400).json({
                error: 'User already exists with this email or username'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        await user.save();
        console.log('Registration successful:', user.email);
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            console.log('No user found with email:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);

        if (!isMatch) {
            console.log('Password mismatch for user:', user.email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', user.email);
        res.json({
            token,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed. Please try again.' });
    }
});