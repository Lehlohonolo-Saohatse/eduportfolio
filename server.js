const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://eduportfolio.onrender.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Added to support credentials if needed
}));
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schemas
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
});

const moduleSchema = new mongoose.Schema({
    name: String,
    type: String,
    description: String,
    startDate: Date,
    endDate: Date,
    projects: [{ title: String, url: String }],
    assessments: [{ name: String, grade: String }],
    status: String,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
});

const projectSchema = new mongoose.Schema({
    title: String,
    module: String,
    description: String,
    technologies: [String],
    date: Date,
    githubUrl: String,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const profileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bio: { type: String, required: true },
    education: [{ degree: String, institution: String }],
    skills: [String],
});

const Category = mongoose.model('Category', categorySchema);
const Module = mongoose.model('Module', moduleSchema);
const Project = mongoose.model('Project', projectSchema);
const User = mongoose.model('User', userSchema);
const Profile = mongoose.model('Profile', profileSchema);

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access token required' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// Profile routes
app.get('/api/profile', authenticateToken, async (req, res) => { // Added authentication
    try {
        const profile = await Profile.findOne();
        if (!profile) return res.status(404).json({ message: 'Profile not found' });
        res.json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
    try {
        let profile = await Profile.findOne();
        if (!profile) {
            profile = new Profile(req.body);
            await profile.save();
            return res.status(201).json(profile);
        }
        profile = await Profile.findOneAndUpdate({}, req.body, { new: true, runValidators: true });
        res.json(profile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(400).json({ message: error.message || 'Failed to update profile' });
    }
});

// Category routes
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const category = new Category(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (error) {
        console.error('Error saving category:', error);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ message: 'Category name must be unique' });
        }
        res.status(400).json({ message: error.message || 'Failed to save category' });
    }
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({ message: error.message || 'Failed to update category' });
    }
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        await Module.updateMany({ categories: req.params.id }, { $pull: { categories: req.params.id } });
        await Project.updateMany({ categories: req.params.id }, { $pull: { categories: req.params.id } });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Module routes
app.get('/api/modules', async (req, res) => {
    try {
        const modules = await Module.find().populate('categories');
        res.json(modules);
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/modules/:id', authenticateToken, async (req, res) => {
    try {
        const module = await Module.findById(req.params.id).populate('categories');
        if (!module) return res.status(404).json({ message: 'Module not found' });
        res.json(module);
    } catch (error) {
        console.error('Error fetching module:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/modules', authenticateToken, async (req, res) => {
    try {
        const module = new Module(req.body);
        await module.save();
        res.status(201).json(module);
    } catch (error) {
        console.error('Error saving module:', error);
        res.status(400).json({ message: error.message || 'Failed to save module' });
    }
});

app.put('/api/modules/:id', authenticateToken, async (req, res) => {
    try {
        const module = await Module.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('categories');
        if (!module) return res.status(404).json({ message: 'Module not found' });
        res.json(module);
    } catch (error) {
        console.error('Error updating module:', error);
        res.status(400).json({ message: error.message || 'Failed to update module' });
    }
});

app.delete('/api/modules/:id', authenticateToken, async (req, res) => {
    try {
        const module = await Module.findByIdAndDelete(req.params.id);
        if (!module) return res.status(404).json({ message: 'Module not found' });
        res.json({ message: 'Module deleted' });
    } catch (error) {
        console.error('Error deleting module:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Project routes
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().populate('categories');
        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id).populate('categories');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
    try {
        const project = new Project(req.body);
        await project.save();
        res.status(201).json(project);
    } catch (error) {
        console.error('Error saving project:', error);
        res.status(400).json({ message: error.message || 'Failed to save project' });
    }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('categories');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(400).json({ message: error.message || 'Failed to update project' });
    }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Initialize default profile
async function initDefaultProfile() {
    try {
        const profileExists = await Profile.findOne();
        if (!profileExists) {
            const defaultProfile = new Profile({
                name: 'N/A',
                bio: 'N/A',
                education: [
                    { degree: 'N/A', institution: 'N/A, N/A' }
                ],
                skills: ['N/A', 'N/A']
            });
            await defaultProfile.save();
            console.log('Default profile created');
        }
    } catch (error) {
        console.error('Error initializing default profile:', error);
    }
}

initDefaultProfile();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
