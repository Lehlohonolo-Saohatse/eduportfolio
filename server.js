require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Enhanced CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'https://eduportfolio.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// MongoDB connection with improved error handling
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    w: 'majority'
})
.then(() => console.log('Successfully connected to MongoDB'))
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Schemas with validation
const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Category name must be at least 2 characters']
    }
}, { timestamps: true });

const moduleSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Module name is required'] },
    type: { 
        type: String, 
        required: true,
        enum: ['university', 'online', 'workshop', 'certification']
    },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: Date,
    projects: [{ 
        title: { type: String, required: true },
        url: { 
            type: String, 
            required: true,
            match: [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, 'Please use a valid URL']
        }
    }],
    assessments: [{
        name: { type: String, required: true },
        grade: { type: String, required: true }
    }],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    categories: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category' 
    }]
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    module: { type: String, required: true },
    description: { type: String, required: true },
    technologies: [{ type: String }],
    date: { type: Date, default: Date.now },
    githubUrl: {
        type: String,
        required: true,
        match: [/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/, 'Please enter a valid GitHub URL']
    },
    categories: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category' 
    }]
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 3
    },
    password: { 
        type: String, 
        required: true,
        minlength: 6
    }
}, { timestamps: true });

const profileSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true
    },
    bio: { 
        type: String, 
        required: [true, 'Bio is required'],
        minlength: [10, 'Bio should be at least 10 characters']
    },
    education: [{
        degree: { type: String, required: true },
        institution: { type: String, required: true }
    }],
    skills: [{ type: String }],
    isPublic: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

// Models
const Category = mongoose.model('Category', categorySchema);
const Module = mongoose.model('Module', moduleSchema);
const Project = mongoose.model('Project', projectSchema);
const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);

// Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Access token required' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid or expired token' 
            });
        }
        req.user = user;
        next();
    });
}

async function checkPublicProfile(req, res, next) {
    try {
        if (req.user) return next();
        
        const publicProfile = await Profile.findOne({ isPublic: true });
        
        if (publicProfile) {
            req.publicProfile = publicProfile;
        }
        
        next();
    } catch (error) {
        console.error('Error in checkPublicProfile:', error);
        next();
    }
}

// Profile Routes
app.get('/api/profile', checkPublicProfile, async (req, res) => {
    try {
        let profile;
        
        if (req.user) {
            profile = await Profile.findOne();
        } else {
            profile = req.publicProfile || {
                name: 'Your Name',
                bio: 'About me...',
                education: [],
                skills: []
            };
        }

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Error in GET /api/profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching profile'
        });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        const { name, bio, education, skills, isPublic } = req.body;
        
        if (!name || !bio) {
            return res.status(400).json({
                success: false,
                message: 'Name and bio are required'
            });
        }

        let profile = await Profile.findOne();
        
        if (!profile) {
            profile = new Profile({
                name,
                bio,
                education: education || [],
                skills: skills || [],
                isPublic: isPublic || false
            });
        } else {
            profile.name = name;
            profile.bio = bio;
            profile.education = education || [];
            profile.skills = skills || [];
            profile.isPublic = isPublic || false;
        }

        await profile.save();

        res.status(200).json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error('Error in PUT /api/profile:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
});

// Category Routes
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error saving category:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to save category'
        });
    }
});

// Module Routes
app.get('/api/modules', async (req, res) => {
    try {
        const modules = await Module.find().populate('categories');
        res.json({
            success: true,
            data: modules
        });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

app.post('/api/modules', authenticateToken, async (req, res) => {
    try {
        const module = new Module(req.body);
        await module.save();
        res.status(201).json({
            success: true,
            data: module
        });
    } catch (error) {
        console.error('Error saving module:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to save module'
        });
    }
});

// Project Routes
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().populate('categories');
        res.json({
            success: true,
            data: projects
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const project = new Project(req.body);
        await project.save();
        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to save project'
        });
    }
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid username or password' 
            });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            success: true,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Initialize default data
async function initializeData() {
    try {
        const profileCount = await Profile.countDocuments();
        
        if (profileCount === 0) {
            await new Profile({
                name: 'Your Name',
                bio: 'About me...',
                education: [{
                    degree: 'Your Degree',
                    institution: 'Your Institution'
                }],
                skills: ['Skill 1', 'Skill 2'],
                isPublic: true
            }).save();
            
            console.log('Default profile created successfully');
        }
        
        // Create default admin user if none exists
        const userCount = await User.countDocuments();
        if (userCount === 0 && process.env.DEFAULT_ADMIN_USERNAME && process.env.DEFAULT_ADMIN_PASSWORD) {
            const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
            await new User({
                username: process.env.DEFAULT_ADMIN_USERNAME,
                password: hashedPassword
            }).save();
            
            console.log('Default admin user created successfully');
        }
    } catch (error) {
        console.error('Error initializing default data:', error);
    }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initializeData();
});
