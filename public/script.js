// API URL configuration with environment fallback
const API_URL = window.location.origin + '/api';
let token = localStorage.getItem('token') || null;

// View Management
const viewSections = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.nav-links a, .sidebar-menu a');

function showView(viewId) {
    viewSections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(viewId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error(`View with ID ${viewId} not found`);
        return;
    }
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-view') === viewId) {
            link.classList.add('active');
        }
    });
    
    if (viewId.startsWith('admin-')) {
        document.getElementById('public-header').style.display = 'none';
        document.getElementById('admin-header').style.display = 'block';
    } else {
        document.getElementById('public-header').style.display = 'block';
        document.getElementById('admin-header').style.display = 'none';
    }

    // Trigger data fetching for specific views
    if (viewId === 'public-home') {
        fetchStats();
        fetchModules(true);
    } else if (viewId === 'public-modules') {
        fetchModules();
    } else if (viewId === 'public-projects') {
        fetchProjects();
    } else if (viewId === 'public-about') {
        loadProfile(false);
    } else if (viewId === 'admin-dashboard') {
        fetchStats(true);
    } else if (viewId === 'admin-modules') {
        fetchAdminModules();
    } else if (viewId === 'admin-projects') {
        fetchAdminProjects();
    } else if (viewId === 'admin-categories') {
        fetchAdminCategories();
    } else if (viewId === 'admin-about') {
        loadProfile(true);
    } else if (viewId === 'admin-add-module' || viewId === 'admin-edit-module') {
        fetchCategoriesForSelect(viewId === 'admin-add-module' ? 'module-categories' : 'edit-module-categories');
    } else if (viewId === 'admin-add-project' || viewId === 'admin-edit-project') {
        fetchCategoriesForSelect(viewId === 'admin-add-project' ? 'project-categories' : 'edit-project-categories');
    }
}

// Navigation event listeners
document.querySelectorAll('[data-view]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.getAttribute('data-view');
        showView(viewId);
    });
});

// Login button
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showView('login-view');
    });
}

// Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        token = null;
        showView('public-home');
    });
}

// Mobile menu button
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const navLinks = document.querySelector('.nav-links');
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Fetch and populate categories for select elements
async function fetchCategoriesForSelect(selectId) {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const categories = await response.json();
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = categories.map(category => `
                <option value="${category._id}">${category.name}</option>
            `).join('') || '<option value="">No categories available</option>';
        }
    } catch (error) {
        console.error('Error fetching categories for select:', error);
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Error loading categories</option>';
        }
    }
}

// Improved Profile Loading System
async function loadProfile(isAdmin) {
    try {
        const headers = {};
        if (isAdmin && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/profile`, { headers });
        
        // Default profile data if API fails
        const defaultProfile = {
            name: 'Your Name',
            bio: 'About me...',
            education: [],
            skills: []
        };

        if (!response.ok) {
            displayProfile(defaultProfile, isAdmin);
            return;
        }

        const data = await response.json();
        const profile = data.data || data;
        displayProfile(profile, isAdmin);
    } catch (error) {
        console.error('Error loading profile:', error);
        displayProfile({
            name: 'Your Name',
            bio: 'About me...',
            education: [],
            skills: []
        }, isAdmin);
    }
}

function displayProfile(profile, isAdmin) {
    if (isAdmin) {
        // Admin view - populate form
        document.getElementById('profile-id').value = profile._id || '';
        document.getElementById('profile-name').value = profile.name || '';
        document.getElementById('profile-bio').value = profile.bio || '';
        
        // Education fields
        const educationContainer = document.getElementById('education-container');
        educationContainer.innerHTML = profile.education?.length > 0 ?
            profile.education.map(edu => `
                <div class="dynamic-field">
                    <input type="text" class="form-control" placeholder="Degree" value="${edu.degree || ''}">
                    <input type="text" class="form-control" placeholder="Institution" value="${edu.institution || ''}">
                    <div class="remove-field">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
            `).join('') :
            `<div class="dynamic-field">
                <input type="text" class="form-control" placeholder="Degree">
                <input type="text" class="form-control" placeholder="Institution">
                <div class="remove-field">
                    <i class="fas fa-times"></i>
                </div>
            </div>`;
        
        // Skills fields
        const skillsContainer = document.getElementById('skills-container');
        skillsContainer.innerHTML = profile.skills?.length > 0 ?
            profile.skills.map(skill => `
                <div class="dynamic-field">
                    <input type="text" class="form-control" placeholder="Skill" value="${skill || ''}">
                    <div class="remove-field">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
            `).join('') :
            `<div class="dynamic-field">
                <input type="text" class="form-control" placeholder="Skill">
                <div class="remove-field">
                    <i class="fas fa-times"></i>
                </div>
            </div>`;
        
        // Set up remove buttons
        document.querySelectorAll('#education-container .remove-field, #skills-container .remove-field').forEach(btn => {
            btn.addEventListener('click', () => btn.parentElement.remove());
        });
    } else {
        // Public view - display profile
        const profileContent = document.getElementById('profile-content');
        if (profileContent) {
            profileContent.innerHTML = `
                <div class="profile-header">
                    <h2>${profile.name || 'Your Name'}</h2>
                    <p class="profile-bio">${profile.bio || 'About me...'}</p>
                </div>
                
                <div class="profile-section">
                    <h3><i class="fas fa-graduation-cap"></i> Education</h3>
                    <ul class="education-list">
                        ${profile.education?.length > 0 ? 
                            profile.education.map(edu => `
                                <li>
                                    <strong>${edu.degree || ''}</strong>
                                    <p>${edu.institution || ''}</p>
                                </li>
                            `).join('') : 
                            '<li>No education information available</li>'}
                    </ul>
                </div>
                
                <div class="profile-section">
                    <h3><i class="fas fa-code"></i> Skills</h3>
                    <div class="skills-container">
                        ${profile.skills?.length > 0 ? 
                            profile.skills.map(skill => `
                                <span class="skill-tag">${skill}</span>
                            `).join('') : 
                            '<span>No skills listed</span>'}
                    </div>
                </div>
            `;
        }
    }
}

// Profile form submission
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const education = Array.from(document.querySelectorAll('#education-container .dynamic-field')).map(field => ({
            degree: field.querySelector('input[placeholder*="Degree"]').value,
            institution: field.querySelector('input[placeholder*="Institution"]').value,
        })).filter(edu => edu.degree && edu.institution);
        
        const skills = Array.from(document.querySelectorAll('#skills-container .dynamic-field')).map(field => 
            field.querySelector('input').value
        ).filter(skill => skill);
        
        const profileData = {
            name: document.getElementById('profile-name').value,
            bio: document.getElementById('profile-bio').value,
            education,
            skills,
            isPublic: document.getElementById('profile-public') ? document.getElementById('profile-public').checked : false,
        };
        
        try {
            const response = await fetch(`${API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });
            
            if (response.ok) {
                const profileSuccess = document.getElementById('profile-success');
                profileSuccess.style.display = 'flex';
                profileForm.reset();
                setTimeout(() => {
                    profileSuccess.style.display = 'none';
                    showView('admin-dashboard');
                    loadProfile(true);
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Error updating profile:', errorData);
                const profileError = document.getElementById('profile-error');
                profileError.style.display = 'flex';
                profileError.textContent = errorData.message || 'Failed to update profile. Please check your input.';
                setTimeout(() => {
                    profileError.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            const profileError = document.getElementById('profile-error');
            profileError.style.display = 'flex';
            profileError.textContent = 'Error connecting to server. Please ensure the backend is running.';
            setTimeout(() => {
                profileError.style.display = 'none';
            }, 3000);
        }
    });
}

// Fetch and display stats
async function fetchStats(isAdmin = false) {
    try {
        const response = await fetch(`${API_URL}/modules`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const modules = await response.json();
        const projectsResponse = await fetch(`${API_URL}/projects`);
        if (!projectsResponse.ok) throw new Error(`HTTP error! Status: ${projectsResponse.status}`);
        const projects = await projectsResponse.json();
        
        const stats = [
            { icon: 'fas fa-book', number: modules.length, label: 'Completed Modules' },
            { icon: 'fas fa-tasks', number: modules.reduce((sum, m) => sum + m.assessments.length, 0), label: 'Assessments' },
            { icon: 'fas fa-project-diagram', number: projects.length, label: 'GitHub Projects' },
            { icon: 'fas fa-certificate', number: modules.filter(m => m.status === 'published').length, label: 'Certifications' },
        ];

        const statsGrid = document.getElementById(isAdmin ? 'admin-stats-grid' : 'stats-grid');
        if (statsGrid) {
            statsGrid.innerHTML = stats.map(stat => `
                <div class="stat-card">
                    <i class="${stat.icon}"></i>
                    <div class="stat-number">${stat.number}</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Fetch and display public modules
async function fetchModules(featured = false) {
    try {
        const response = await fetch(`${API_URL}/modules`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const modules = await response.json();
        
        const moduleTypes = {
            university: { icon: 'fas fa-university', label: 'University Course', class: 'web-dev' },
            online: { icon: 'fas fa-laptop-code', label: 'Online Course', class: 'ds-algo' },
            workshop: { icon: 'fas fa-chalkboard-teacher', label: 'Workshop', class: 'db' },
            certification: { icon: 'fas fa-certificate', label: 'Certification', class: 'ai' },
        };

        const renderModule = module => {
            const type = moduleTypes[module.type] || moduleTypes.university;
            const badgeClass = module.status === 'published' ? 'badge-primary' :
                             module.status === 'archived' ? 'badge-success' : 'badge-warning';
            const badgeIcon = module.status === 'published' ? 'fas fa-check-circle' :
                            module.status === 'archived' ? 'fas fa-certificate' : 'fas fa-spinner';
            const dateString = module.endDate ? 
                `${new Date(module.startDate).toLocaleDateString()} - ${new Date(module.endDate).toLocaleDateString()}` :
                `Started: ${new Date(module.startDate).toLocaleDateString()}`;
            
            return `
                <div class="module-card">
                    <div class="module-header ${type.class}">
                        <h3 class="module-title">${module.name}</h3>
                        <div class="module-type">
                            <i class="${type.icon}"></i> ${type.label}
                        </div>
                    </div>
                    <div class="module-body">
                        <div class="module-info">
                            <p>
                                <i class="fas fa-calendar"></i>
                                <strong>Duration:</strong> ${dateString}
                            </p>
                            <p>
                                <i class="fas fa-tags"></i>
                                <strong>Categories:</strong> ${module.categories.map(c => c.name).join(', ') || 'None'}
                            </p>
                            <p>
                                <i class="fas fa-align-left"></i>
                                <strong>Topics:</strong> ${module.description}
                            </p>
                        </div>
                        <div>
                            <h4><i class="fas fa-tasks"></i> Assessments</h4>
                            <ul>
                                ${module.assessments.map(a => `<li>${a.name}: ${a.grade}</li>`).join('') || '<li>No assessments</li>'}
                            </ul>
                        </div>
                        <div style="margin-top: 1rem;">
                            <h4><i class="fab fa-github"></i> GitHub Projects</h4>
                            <ul>
                                ${module.projects.map(p => `
                                    <li>
                                        <a href="${p.url}" class="github-link" target="_blank">
                                            <i class="fas fa-link"></i> ${p.title}
                                        </a>
                                    </li>
                                `).join('') || '<li>No projects</li>'}
                            </ul>
                        </div>
                    </div>
                    <div class="module-footer">
                        <span class="badge ${badgeClass}">
                            <i class="${badgeIcon}"></i> ${module.status.charAt(0).toUpperCase() + module.status.slice(1)}
                        </span>
                        <span>${new Date(module.startDate).getFullYear()}</span>
                    </div>
                </div>
            `;
        };

        const featuredModules = document.getElementById('featured-modules');
        const allModules = document.getElementById('all-modules');
        
        if (featured && featuredModules) {
            featuredModules.innerHTML = modules.slice(0, 2).map(renderModule).join('') || '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No modules available</p></div>';
        }
        if (allModules) {
            allModules.innerHTML = modules.map(renderModule).join('') || '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No modules available</p></div>';
        }
    } catch (error) {
        console.error('Error fetching modules:', error);
        const container = featured ? document.getElementById('featured-modules') : document.getElementById('all-modules');
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading modules</p></div>';
        }
    }
}

// Fetch and display admin modules
async function fetchAdminModules() {
    try {
        const response = await fetch(`${API_URL}/modules`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const modules = await response.json();
        
        const moduleTypes = {
            university: { icon: 'fas fa-university', label: 'University Course', class: 'web-dev' },
            online: { icon: 'fas fa-laptop-code', label: 'Online Course', class: 'ds-algo' },
            workshop: { icon: 'fas fa-chalkboard-teacher', label: 'Workshop', class: 'db' },
            certification: { icon: 'fas fa-certificate', label: 'Certification', class: 'ai' },
        };

        const adminModules = document.getElementById('admin-all-modules');
        if (adminModules) {
            adminModules.innerHTML = modules.map(module => {
                const type = moduleTypes[module.type] || moduleTypes.university;
                const badgeClass = module.status === 'published' ? 'badge-primary' :
                                 module.status === 'archived' ? 'badge-success' : 'badge-warning';
                const badgeIcon = module.status === 'published' ? 'fas fa-check-circle' :
                                module.status === 'archived' ? 'fas fa-certificate' : 'fas fa-spinner';
                const dateString = module.endDate ? 
                    `${new Date(module.startDate).toLocaleDateString()} - ${new Date(module.endDate).toLocaleDateString()}` :
                    `Started: ${new Date(module.startDate).toLocaleDateString()}`;
                
                return `
                    <div class="module-card">
                        <div class="module-header ${type.class}">
                            <h3 class="module-title">${module.name}</h3>
                            <div class="module-type">
                                <i class="${type.icon}"></i> ${type.label}
                            </div>
                        </div>
                        <div class="module-body">
                            <div class="module-info">
                                <p>
                                    <i class="fas fa-calendar"></i>
                                    <strong>Duration:</strong> ${dateString}
                                </p>
                                <p>
                                    <i class="fas fa-tags"></i>
                                    <strong>Categories:</strong> ${module.categories.map(c => c.name).join(', ') || 'None'}
                                </p>
                                <p>
                                    <i class="fas fa-align-left"></i>
                                    <strong>Topics:</strong> ${module.description}
                                </p>
                            </div>
                        </div>
                        <div class="module-footer">
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-primary btn-sm edit-module" data-id="${module._id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm delete-module" data-id="${module._id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                            <span class="badge ${badgeClass}">
                                <i class="${badgeIcon}"></i> ${module.status.charAt(0).toUpperCase() + module.status.slice(1)}
                            </span>
                        </div>
                    </div>
                `;
            }).join('') || '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No modules available</p></div>';

            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-module').forEach(button => {
                button.addEventListener('click', async () => {
                    const moduleId = button.getAttribute('data-id');
                    try {
                        const response = await fetch(`${API_URL}/modules/${moduleId}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                        }
                        const module = await response.json();
                        
                        document.getElementById('edit-module-id').value = module._id;
                        document.getElementById('edit-module-name').value = module.name;
                        document.getElementById('edit-module-type').value = module.type;
                        document.getElementById('edit-module-desc').value = module.description;
                        document.getElementById('edit-start-date').value = new Date(module.startDate).toISOString().split('T')[0];
                        document.getElementById('edit-end-date').value = module.endDate ? new Date(module.endDate).toISOString().split('T')[0] : '';
                        document.getElementById('edit-module-status').value = module.status;

                        await fetchCategoriesForSelect('edit-module-categories');
                        const categorySelect = document.getElementById('edit-module-categories');
                        Array.from(categorySelect.options).forEach(option => {
                            option.selected = module.categories.some(c => c._id === option.value);
                        });

                        const projectsContainer = document.getElementById('edit-projects-container');
                        projectsContainer.innerHTML = module.projects.length > 0 ?
                            module.projects.map(p => `
                                <div class="dynamic-field">
                                    <input type="text" class="form-control" placeholder="Project title" value="${p.title}">
                                    <input type="url" class="form-control" placeholder="GitHub URL" value="${p.url}">
                                    <div class="remove-field">
                                        <i class="fas fa-times"></i>
                                    </div>
                                </div>
                            `).join('') :
                            `<div class="dynamic-field">
                                <input type="text" class="form-control" placeholder="Project title">
                                <input type="url" class="form-control" placeholder="GitHub URL">
                                <div class="remove-field">
                                    <i class="fas fa-times"></i>
                                </div>
                            </div>`;

                        const assessmentsContainer = document.getElementById('edit-assessments-container');
                        assessmentsContainer.innerHTML = module.assessments.length > 0 ?
                            module.assessments.map(a => `
                                <div class="dynamic-field">
                                    <input type="text" class="form-control" placeholder="Assessment name" value="${a.name}">
                                    <input type="text" class="form-control" placeholder="Grade/Result" value="${a.grade}">
                                    <div class="remove-field">
                                        <i class="fas fa-times"></i>
                                    </div>
                                </div>
                            `).join('') :
                            `<div class="dynamic-field">
                                <input type="text" class="form-control" placeholder="Assessment name">
                                <input type="text" class="form-control" placeholder="Grade/Result">
                                <div class="remove-field">
                                    <i class="fas fa-times"></i>
                                </div>
                            </div>`;

                        document.querySelectorAll('#edit-projects-container .remove-field, #edit-assessments-container .remove-field').forEach(btn => {
                            btn.addEventListener('click', () => btn.parentElement.remove());
                        });

                        showView('admin-edit-module');
                    } catch (error) {
                        console.error('Error fetching module for edit:', error);
                        alert(error.message === 'Module not found' ? 'Module not found. It may have been deleted.' : 'Failed to load module for editing. Please try again.');
                    }
                });
            });

            document.querySelectorAll('.delete-module').forEach(button => {
                button.addEventListener('click', async () => {
                    const moduleId = button.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this module?')) {
                        try {
                            const response = await fetch(`${API_URL}/modules/${moduleId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                            }
                            fetchAdminModules();
                        } catch (error) {
                            console.error('Error deleting module:', error);
                            alert(error.message === 'Module not found' ? 'Module not found. It may have been deleted.' : 'Error deleting module. Please try again.');
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error fetching admin modules:', error);
        const adminModules = document.getElementById('admin-all-modules');
        if (adminModules) {
            adminModules.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading modules</p></div>';
        }
    }
}

// Fetch and display public projects
async function fetchProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const projects = await response.json();
        
        const projectTypes = {
            'Web Development Fundamentals': 'web-dev',
            'Data Structures & Algorithms': 'ds-algo',
            'Database Systems': 'db',
            'Artificial Intelligence': 'ai',
        };

        const allProjects = document.getElementById('all-projects');
        if (allProjects) {
            allProjects.innerHTML = projects.map(project => {
                const typeClass = projectTypes[project.module] || 'web-dev';
                return `
                    <div class="module-card">
                        <div class="module-header ${typeClass}">
                            <h3 class="module-title">${project.title}</h3>
                            <div class="module-type">
                                <i class="fab fa-github"></i> GitHub Project
                            </div>
                        </div>
                        <div class="module-body">
                            <div class="module-info">
                                <p>
                                    <i class="fas fa-tag"></i>
                                    <strong>Module:</strong> ${project.module}
                                </p>
                                <p>
                                    <i class="fas fa-tags"></i>
                                    <strong>Categories:</strong> ${project.categories.map(c => c.name).join(', ') || 'None'}
                                </p>
                                <p>
                                    <i class="fas fa-code"></i>
                                    <strong>Technologies:</strong> ${project.technologies.join(', ')}
                                </p>
                                <p>
                                    <i class="fas fa-calendar"></i>
                                    <strong>Date:</strong> ${new Date(project.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <h4><i class="fas fa-info-circle"></i> Description</h4>
                                <p>${project.description}</p>
                            </div>
                        </div>
                        <div class="module-footer">
                            <a href="${project.githubUrl}" class="btn btn-primary" style="width: 100%;" target="_blank">
                                <i class="fab fa-github"></i> View on GitHub
                            </a>
                        </div>
                    </div>
                `;
            }).join('') || '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No projects available</p></div>';
        }
    } catch (error) {
        console.error('Error fetching projects:', error);
        const allProjects = document.getElementById('all-projects');
        if (allProjects) {
            allProjects.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading projects</p></div>';
        }
    }
}

// Fetch and display admin projects
async function fetchAdminProjects() {
    try {
        const response = await fetch(`${API_URL}/projects`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const projects = await response.json();
        
        const projectTypes = {
            'Web Development Fundamentals': 'web-dev',
            'Data Structures & Algorithms': 'ds-algo',
            'Database Systems': 'db',
            'Artificial Intelligence': 'ai',
        };

        const adminProjects = document.getElementById('admin-all-projects');
        if (adminProjects) {
            adminProjects.innerHTML = projects.map(project => {
                const typeClass = projectTypes[project.module] || 'web-dev';
                return `
                    <div class="module-card">
                        <div class="module-header ${typeClass}">
                            <h3 class="module-title">${project.title}</h3>
                            <div class="module-type">
                                <i class="fab fa-github"></i> GitHub Project
                            </div>
                        </div>
                        <div class="module-body">
                            <div class="module-info">
                                <p>
                                    <i class="fas fa-tag"></i>
                                    <strong>Module:</strong> ${project.module}
                                </p>
                                <p>
                                    <i class="fas fa-tags"></i>
                                    <strong>Categories:</strong> ${project.categories.map(c => c.name).join(', ') || 'None'}
                                </p>
                                <p>
                                    <i class="fas fa-code"></i>
                                    <strong>Technologies:</strong> ${project.technologies.join(', ')}
                                </p>
                                <p>
                                    <i class="fas fa-calendar"></i>
                                    <strong>Date:</strong> ${new Date(project.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <h4><i class="fas fa-info-circle"></i> Description</h4>
                                <p>${project.description}</p>
                            </div>
                        </div>
                        <div class="module-footer">
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-primary btn-sm edit-project" data-id="${project._id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm delete-project" data-id="${project._id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                            <a href="${project.githubUrl}" class="btn btn-primary btn-sm" target="_blank">
                                <i class="fab fa-github"></i> View
                            </a>
                        </div>
                    </div>
                `;
            }).join('') || '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No projects available</p></div>';

            document.querySelectorAll('.edit-project').forEach(button => {
                button.addEventListener('click', async () => {
                    const projectId = button.getAttribute('data-id');
                    try {
                        const response = await fetch(`${API_URL}/projects/${projectId}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                        }
                        const project = await response.json();
                        
                        document.getElementById('edit-project-id').value = project._id;
                        document.getElementById('edit-project-title').value = project.title;
                        document.getElementById('edit-project-module').value = project.module;
                        document.getElementById('edit-project-desc').value = project.description;
                        document.getElementById('edit-project-technologies').value = project.technologies.join(', ');
                        document.getElementById('edit-project-date').value = new Date(project.date).toISOString().split('T')[0];
                        document.getElementById('edit-project-github').value = project.githubUrl;

                        await fetchCategoriesForSelect('edit-project-categories');
                        const categorySelect = document.getElementById('edit-project-categories');
                        Array.from(categorySelect.options).forEach(option => {
                            option.selected = project.categories.some(c => c._id === option.value);
                        });
                        
                        showView('admin-edit-project');
                    } catch (error) {
                        console.error('Error fetching project for edit:', error);
                        alert(error.message === 'Project not found' ? 'Project not found. It may have been deleted.' : 'Failed to load project for editing. Please try again.');
                    }
                });
            });

            document.querySelectorAll('.delete-project').forEach(button => {
                button.addEventListener('click', async () => {
                    const projectId = button.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this project?')) {
                        try {
                            const response = await fetch(`${API_URL}/projects/${projectId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                            }
                            fetchAdminProjects();
                        } catch (error) {
                            console.error('Error deleting project:', error);
                            alert(error.message === 'Project not found' ? 'Project not found. It may have been deleted.' : 'Error deleting project. Please try again.');
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error fetching admin projects:', error);
        const adminProjects = document.getElementById('admin-all-projects');
        if (adminProjects) {
            adminProjects.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading projects</p></div>';
        }
    }
}

// Fetch and display admin categories
async function fetchAdminCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const categories = await response.json();
        
        const adminCategories = document.getElementById('admin-all-categories');
        if (adminCategories) {
            adminCategories.innerHTML = categories.map(category => `
                <div class="module-card">
                    <div class="module-header web-dev">
                        <h3 class="module-title">${category.name}</h3>
                        <div class="module-type">
                            <i class="fas fa-tags"></i> Category
                        </div>
                    </div>
                    <div class="module-footer">
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary btn-sm edit-category" data-id="${category._id}" data-name="${category.name}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm delete-category" data-id="${category._id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('') || '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>No categories available</p></div>';

            document.querySelectorAll('.edit-category').forEach(button => {
                button.addEventListener('click', () => {
                    const categoryId = button.getAttribute('data-id');
                    const categoryName = button.getAttribute('data-name');
                    
                    document.getElementById('category-id').value = categoryId;
                    document.getElementById('category-name').value = categoryName;
                    document.getElementById('category-submit').innerHTML = '<i class="fas fa-save"></i> Update Category';
                });
            });

            document.querySelectorAll('.delete-category').forEach(button => {
                button.addEventListener('click', async () => {
                    const categoryId = button.getAttribute('data-id');
                    if (confirm('Are you sure you want to delete this category? It will be removed from all modules and projects.')) {
                        try {
                            const response = await fetch(`${API_URL}/categories/${categoryId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` },
                            });
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
                            }
                            fetchAdminCategories();
                        } catch (error) {
                            console.error('Error deleting category:', error);
                            alert(error.message === 'Category not found' ? 'Category not found. It may have been deleted.' : 'Error deleting category. Please try again.');
                        }
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error fetching admin categories:', error);
        const adminCategories = document.getElementById('admin-all-categories');
        if (adminCategories) {
            adminCategories.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading categories</p></div>';
        }
    }
}

// Category form submission
const categoryForm = document.getElementById('category-form');
if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categoryId = document.getElementById('category-id').value;
        const categoryData = {
            name: document.getElementById('category-name').value,
        };
        
        const method = categoryId ? 'PUT' : 'POST';
        const url = categoryId ? `${API_URL}/categories/${categoryId}` : `${API_URL}/categories`;
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(categoryData),
            });
            
            if (response.ok) {
                const categorySuccess = document.getElementById('category-success');
                categorySuccess.textContent = categoryId ? 'Category updated successfully!' : 'Category saved successfully!';
                categorySuccess.style.display = 'flex';
                categoryForm.reset();
                document.getElementById('category-id').value = '';
                document.getElementById('category-submit').innerHTML = '<i class="fas fa-save"></i> Save Category';
                
                setTimeout(() => {
                    categorySuccess.style.display = 'none';
                    fetchAdminCategories();
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Error saving category:', errorData);
                const categoryError = document.getElementById('category-error');
                categoryError.style.display = 'flex';
                categoryError.textContent = errorData.message || 'Failed to save category. Please check your input.';
                setTimeout(() => {
                    categoryError.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error saving category:', error);
            const categoryError = document.getElementById('category-error');
            categoryError.style.display = 'flex';
            categoryError.textContent = 'Error connecting to server. Please ensure the backend is running.';
            setTimeout(() => {
                categoryError.style.display = 'none';
            }, 3000);
        }
    });
}

// Login form submission
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await response.json();
            
            if (response.ok) {
                token = data.token;
                localStorage.setItem('token', token);
                showView('admin-dashboard');
            } else {
                const loginError = document.getElementById('login-error');
                loginError.style.display = 'flex';
                loginError.textContent = data.message || 'Invalid username or password';
                setTimeout(() => {
                    loginError.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Login error:', error);
            const loginError = document.getElementById('login-error');
            loginError.style.display = 'flex';
            loginError.textContent = 'Error connecting to server';
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    });
}

// Module form submission
const moduleForm = document.getElementById('module-form');
if (moduleForm) {
    moduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const projects = Array.from(document.querySelectorAll('#projects-container .dynamic-field')).map(field => ({
            title: field.querySelector('input[type="text"]').value,
            url: field.querySelector('input[type="url"]').value,
        })).filter(p => p.title && p.url);
        
        const assessments = Array.from(document.querySelectorAll('#assessments-container .dynamic-field')).map(field => ({
            name: field.querySelector('input[type="text"]').value,
            grade: field.querySelector('input[type="text"][placeholder="Grade/Result"]').value,
        })).filter(a => a.name);
        
        const categories = Array.from(document.getElementById('module-categories').selectedOptions).map(option => option.value);
        
        const moduleData = {
            name: document.getElementById('module-name').value,
            type: document.getElementById('module-type').value,
            description: document.getElementById('module-desc').value,
            startDate: document.getElementById('start-date').value,
            endDate: document.getElementById('end-date').value || null,
            projects,
            assessments,
            status: document.getElementById('module-status').value,
            categories,
        };
        
        try {
            const response = await fetch(`${API_URL}/modules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(moduleData),
            });
            
            if (response.ok) {
                const moduleSuccess = document.getElementById('module-success');
                moduleSuccess.style.display = 'flex';
                moduleForm.reset();
                setTimeout(() => {
                    moduleSuccess.style.display = 'none';
                    showView('admin-modules');
                    fetchAdminModules();
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Error saving module:', errorData);
                const moduleError = document.getElementById('module-error') || document.createElement('div');
                moduleError.className = 'alert alert-error';
                moduleError.style.display = 'flex';
                moduleError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorData.message || 'Failed to save module. Please check your input and authentication.'}`;
                moduleForm.prepend(moduleError);
                setTimeout(() => {
                    moduleError.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error saving module:', error);
            const moduleError = document.getElementById('module-error') || document.createElement('div');
            moduleError.className = 'alert alert-error';
            moduleError.style.display = 'flex';
            moduleError.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error connecting to server. Please ensure the backend is running.`;
            moduleForm.prepend(moduleError);
            setTimeout(() => {
                moduleError.style.display = 'none';
            }, 3000);
        }
    });
}

// Edit module form submission
const editModuleForm = document.getElementById('edit-module-form');
if (editModuleForm) {
    editModuleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const moduleId = document.getElementById('edit-module-id').value;
        const projects = Array.from(document.querySelectorAll('#edit-projects-container .dynamic-field')).map(field => ({
            title: field.querySelector('input[type="text"]').value,
            url: field.querySelector('input[type="url"]').value,
        })).filter(p => p.title && p.url);
        
        const assessments = Array.from(document.querySelectorAll('#edit-assessments-container .dynamic-field')).map(field => ({
            name: field.querySelector('input[type="text"]').value,
            grade: field.querySelector('input[type="text"][placeholder="Grade/Result"]').value,
        })).filter(a => a.name);
        
        const categories = Array.from(document.getElementById('edit-module-categories').selectedOptions).map(option => option.value);
        
        const moduleData = {
            name: document.getElementById('edit-module-name').value,
            type: document.getElementById('edit-module-type').value,
            description: document.getElementById('edit-module-desc').value,
            startDate: document.getElementById('edit-start-date').value,
            endDate: document.getElementById('edit-end-date').value || null,
            projects,
            assessments,
            status: document.getElementById('edit-module-status').value,
            categories,
        };
        
        try {
            const response = await fetch(`${API_URL}/modules/${moduleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(moduleData),
            });
            
            if (response.ok) {
                const moduleSuccess = document.getElementById('module-success');
                moduleSuccess.style.display = 'flex';
                moduleSuccess.textContent = 'Module updated successfully!';
                editModuleForm.reset();
                setTimeout(() => {
                    moduleSuccess.style.display = 'none';
                    showView('admin-modules');
                    fetchAdminModules();
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Error updating module:', errorData);
                const moduleError = document.getElementById('module-error') || document.createElement('div');
                moduleError.className = 'alert alert-error';
                moduleError.style.display = 'flex';
                moduleError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorData.message || 'Failed to update module. Please check your input and authentication.'}`;
                editModuleForm.prepend(moduleError);
                setTimeout(() => {
                    moduleError.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error updating module:', error);
            const moduleError = document.getElementById('module-error') || document.createElement('div');
            moduleError.className = 'alert alert-error';
            moduleError.style.display = 'flex';
            moduleError.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error connecting to server. Please ensure the backend is running.`;
            editModuleForm.prepend(moduleError);
            setTimeout(() => {
                moduleError.style.display = 'none';
            }, 3000);
        }
    });
}

// Project form submission
const projectForm = document.getElementById('project-form');
if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const categories = Array.from(document.getElementById('project-categories').selectedOptions).map(option => option.value);
        
        const projectData = {
            title: document.getElementById('project-title').value,
            module: document.getElementById('project-module').value,
            description: document.getElementById('project-desc').value,
            technologies: document.getElementById('project-technologies').value.split(',').map(tech => tech.trim()).filter(tech => tech),
            date: document.getElementById('project-date').value,
            githubUrl: document.getElementById('project-github').value,
            categories,
        };
        
        try {
            const response = await fetch(`${API_URL}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });
            
            if (response.ok) {
                const projectSuccess = document.getElementById('project-success');
                projectSuccess.style.display = 'flex';
                projectForm.reset();
                setTimeout(() => {
                    projectSuccess.style.display = 'none';
                    showView('admin-projects');
                    fetchAdminProjects();
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Error saving project:', errorData);
                const projectError = document.getElementById('project-error');
                projectError.style.display = 'flex';
                projectError.textContent = errorData.message || 'Failed to save project. Please check your input and authentication.';
                setTimeout(() => {
                    projectError.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error saving project:', error);
            const projectError = document.getElementById('project-error');
            projectError.style.display = 'flex';
            projectError.textContent = 'Error connecting to server. Please ensure the backend is running.';
            setTimeout(() => {
                projectError.style.display = 'none';
            }, 3000);
        }
    });
}

// Edit project form submission
const editProjectForm = document.getElementById('edit-project-form');
if (editProjectForm) {
    editProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const projectId = document.getElementById('edit-project-id').value;
        const categories = Array.from(document.getElementById('edit-project-categories').selectedOptions).map(option => option.value);
        
        const projectData = {
            title: document.getElementById('edit-project-title').value,
            module: document.getElementById('edit-project-module').value,
            description: document.getElementById('edit-project-desc').value,
            technologies: document.getElementById('edit-project-technologies').value.split(',').map(tech => tech.trim()).filter(tech => tech),
            date: document.getElementById('edit-project-date').value,
            githubUrl: document.getElementById('edit-project-github').value,
            categories,
        };
        
        try {
            const response = await fetch(`${API_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(projectData),
            });
            
            if (response.ok) {
                const projectSuccess = document.getElementById('project-success');
                projectSuccess.style.display = 'flex';
                projectSuccess.textContent = 'Project updated successfully!';
                editProjectForm.reset();
                setTimeout(() => {
                    projectSuccess.style.display = 'none';
                    showView('admin-projects');
                    fetchAdminProjects();
                }, 2000);
            } else {
                const errorData = await response.json();
                console.error('Error updating project:', errorData);
                const projectError = document.getElementById('project-error');
                projectError.style.display = 'flex';
                projectError.textContent = errorData.message || 'Failed to update project. Please check your input and authentication.';
                setTimeout(() => {
                    projectError.style.display = 'none';
                }, 3000);
            }
        } catch (error) {
            console.error('Error updating project:', error);
            const projectError = document.getElementById('project-error');
            projectError.style.display = 'flex';
            projectError.textContent = 'Error connecting to server. Please ensure the backend is running.';
            setTimeout(() => {
                projectError.style.display = 'none';
            }, 3000);
        }
    });
}

// Dynamic form fields
function setupDynamicFields(containerId, addButtonId, type) {
    const addButton = document.getElementById(addButtonId);
    if (addButton) {
        addButton.addEventListener('click', () => {
            const container = document.getElementById(containerId);
            const newField = document.createElement('div');
            newField.className = 'dynamic-field';
            if (type === 'project') {
                newField.innerHTML = `
                    <input type="text" class="form-control" placeholder="Project title">
                    <input type="url" class="form-control" placeholder="GitHub URL">
                    <div class="remove-field">
                        <i class="fas fa-times"></i>
                    </div>`;
            } else if (type === 'assessment') {
                newField.innerHTML = `
                    <input type="text" class="form-control" placeholder="Assessment name">
                    <input type="text" class="form-control" placeholder="Grade/Result">
                    <div class="remove-field">
                        <i class="fas fa-times"></i>
                    </div>`;
            } else if (type === 'education') {
                newField.innerHTML = `
                    <input type="text" class="form-control" placeholder="Degree (e.g., MSc in AI)">
                    <input type="text" class="form-control" placeholder="Institution and Years (e.g., Tech University, 2023-2025)">
                    <div class="remove-field">
                        <i class="fas fa-times"></i>
                    </div>`;
            } else if (type === 'skill') {
                newField.innerHTML = `
                    <input type="text" class="form-control" placeholder="Skill (e.g., JavaScript)">
                    <div class="remove-field">
                        <i class="fas fa-times"></i>
                    </div>`;
            }
            container.appendChild(newField);
            
            newField.querySelector('.remove-field').addEventListener('click', () => {
                container.removeChild(newField);
            });
        });
    }
}

setupDynamicFields('projects-container', 'add-project', 'project');
setupDynamicFields('assessments-container', 'add-assessment', 'assessment');
setupDynamicFields('edit-projects-container', 'edit-add-project', 'project');
setupDynamicFields('edit-assessments-container', 'edit-add-assessment', 'assessment');
setupDynamicFields('education-container', 'add-education', 'education');
setupDynamicFields('skills-container', 'add-skill', 'skill');

document.querySelectorAll('.remove-field').forEach(button => {
    button.addEventListener('click', function() {
        this.parentElement.remove();
    });
});

// Initialize
showView('public-home');
