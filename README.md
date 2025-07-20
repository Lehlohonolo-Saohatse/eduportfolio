# EduPortfolio 🚀

![License](https://img.shields.io/badge/license-Proprietary-blue.svg)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)

**EduPortfolio** is a sleek, single-page web application designed to showcase your academic achievements and technical skills. With public views for displaying educational modules, GitHub projects, and personal profiles, plus secure admin views for managing content, it’s built for usability, responsiveness, and seamless integration with a backend API. Perfect for students, professionals, and developers looking to present their educational journey to the world. 🌟

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Integration](#api-integration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🌟 Overview
EduPortfolio empowers users to showcase their educational milestones, projects, and skills in a modern, responsive portfolio. Whether you're highlighting completed modules, GitHub projects, or your professional profile, this app delivers a polished experience for public viewers and robust management tools for admins. It leverages a RESTful API for dynamic content and supports flexible form inputs for easy updates.

## ✨ Features
- **Public Views**:
  - 🏠 **Home**: Engaging hero section with stats (e.g., modules completed, certifications) and featured modules.
  - 📚 **Modules**: Detailed view of academic modules, including duration, categories, assessments, and linked projects.
  - 💻 **Projects**: Showcase GitHub projects with technologies, descriptions, and direct links.
  - 👤 **About**: Personal profile with name, bio, education, and skills.

- **Admin Interface** (Authenticated):
  - 📊 **Dashboard**: Quick stats and navigation for content management.
  - 🛠️ **Modules**: Add, edit, or delete modules with support for projects and assessments.
  - 🔗 **Projects**: Manage GitHub projects with details like technologies and categories.
  - 🏷️ **Categories**: Organize content with custom categories.
  - ✍️ **Profile**: Edit personal details with dynamic fields for education and skills.
  - 🔐 **Authentication**: Secure JWT-based login/logout.

- **User Experience**:
  - 📱 Responsive design with mobile-friendly navigation.
  - ➕ Dynamic forms for adding/removing projects, assessments, education, and skills.
  - 🔔 Real-time success/error notifications.

## 🛠️ Tech Stack
- **Frontend**:
  - HTML5, CSS3, JavaScript (ES6+)
  - Font Awesome 6.4.0 for icons
- **Dependencies**:
  - [Font Awesome CDN](https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css)
- **Backend** (Not Included):
  - RESTful API for modules, projects, categories, profile, and authentication
- **Supported Browsers**: Chrome, Firefox, Safari, Edge (latest versions)

## 🚀 Getting Started
Get EduPortfolio up and running locally in just a few steps:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Lehlohonolo-Saohatse/eduportfolio.git
   cd eduportfolio
   ```

2. **Set Up the Backend**:
   - Deploy a RESTful API at `http://your-domain/api` (see [API Integration](#api-integration)).
   - Update `API_URL` in `script.js` if necessary (default: `window.location.origin + '/api'`).

3. **Serve the Frontend**:
   - Use a static file server (e.g., Node.js with Express, Python's `http.server`, or Nginx/Apache).
   - Example:
     ```bash
     python -m http.server 8000
     ```
   - Open `http://localhost:8000` in your browser.

4. **Configure Assets**:
   - Ensure `styles.css` is in the project root with appropriate styling.
   - Place the profile image (`./images/profile.jpeg`) in the `images` directory or update the path in `index.html`.

5. **Verify Dependencies**:
   - Font Awesome is loaded via CDN. Ensure internet access or host locally for offline use.

## 📖 Usage
- **For Public Users**:
  - Browse the home, modules, projects, or about pages via the navigation bar.
  - On mobile, toggle the hamburger menu for navigation.

- **For Admins**:
  - Click "Admin Login" and sign in with valid credentials.
  - Use the dashboard or sidebar to manage modules, projects, categories, or profile details.
  - Log out to return to public views.

- **For Developers**:
  - Test API endpoints with tools like Postman.
  - Debug JavaScript using browser dev tools.
  - Extend functionality (e.g., add search, filters, or image uploads).

## 🔌 API Integration
EduPortfolio connects to a backend API at `window.location.origin + '/api'`. Required endpoints include:

- **Modules**:
  - `GET /modules`: List all modules.
  - `GET /modules/:id`: Get a specific module.
  - `POST /modules`: Create a module.
  - `PUT /modules/:id`: Update a module.
  - `DELETE /modules/:id`: Delete a module.

- **Projects**:
  - `GET /projects`: List all projects.
  - `GET /projects/:id`: Get a specific project.
  - `POST /projects`: Create a project.
  - `PUT /projects/:id`: Update a project.
  - `DELETE /projects/:id`: Delete a project.

- **Categories**:
  - `GET /categories`: List all categories.
  - `POST /categories`: Create a category.
  - `PUT /categories/:id`: Update a category.
  - `DELETE /categories/:id`: Delete a category.

- **Profile**:
  - `GET /profile`: Retrieve profile data.
  - `PUT /profile`: Update profile data.

- **Authentication**:
  - `POST /auth/login`: Authenticate and return a JWT token.

Admin requests require an `Authorization: Bearer <token>` header. The backend must support JWT authentication and return errors with a `message` field.

## 📂 Project Structure
```
eduportfolio/
├── index.html         # Main HTML file with public and admin views
├── script.js          # JavaScript for view management, API calls, and forms
├── styles.css         # CSS for styling (customize as needed)
├── images/            # Static assets
│   └── profile.jpeg   # Profile image
└── README.md          # This documentation
```

## 🤝 Contributing
We’d love your help to make EduPortfolio even better! To contribute:
1. Fork the repo.
2. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature"
   ```
4. Push to the branch:
   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request with a clear description.

**Guidelines**:
- Match the existing code style.
- Include tests for new features.
- Ensure API compatibility.
- Report issues or suggest ideas via [GitHub Issues](https://github.com/Lehlohonolo-Saohatse/eduportfolio/issues).

## 📜 License
© 2025 Lehlohonolo Saohatse. All rights reserved.

