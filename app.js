// DOM elements - Main UI
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const pickForm = document.getElementById('pickForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminDashboard = document.getElementById('adminDashboard');

// Navigation buttons
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const showAdminLoginBtn = document.getElementById('showAdminLogin');
const backToLoginBtn = document.getElementById('backToLogin');
const logoutBtn = document.getElementById('logout');
const adminLogoutBtn = document.getElementById('adminLogout');

// User interface elements
const dayInfoSpan = document.getElementById('dayInfo');
const requiredInfoSpan = document.getElementById('requiredInfo');
const availableTeamsDiv = document.getElementById('availableTeams');
const selectedTeamsDiv = document.getElementById('selectedTeams');
const previousPicksDiv = document.getElementById('previousPicks');
const submitPicksBtn = document.getElementById('submitPicks');

// Admin interface elements
const usersListDiv = document.getElementById('usersList');
const allPicksDiv = document.getElementById('allPicks');
const currentDaySelect = document.getElementById('currentDaySelect');
const requiredPicksInput = document.getElementById('requiredPicksInput');
const updatePoolSettingsBtn = document.getElementById('updatePoolSettings');

// Base API URL - change this to your Vercel deployment URL
const API_URL = window.location.origin + '/api';

// Application state
let token = localStorage.getItem('token');
let isAdmin = localStorage.getItem('isAdmin') === 'true';
let currentUser = null;
let availableTeams = [];
let selectedTeams = [];
let requiredPicks = 2;
let currentDay = 'Thursday';
let previousPicks = [];
let allTeams = [];
let allUsers = [];
let allUserPicks = [];
let editingPickId = null;

// Initialize the application
init();

function init() {
  // VERSION INDICATOR - Remove this after confirming the update is live
  console.log("Running MONGODB version - March 18, 2025");
  
  // Add a visible indicator on the login page
  const versionIndicator = document.createElement('div');
  versionIndicator.style.position = 'fixed';
  versionIndicator.style.bottom = '10px';
  versionIndicator.style.right = '10px';
  versionIndicator.style.background = '#4caf50';
  versionIndicator.style.color = 'white';
  versionIndicator.style.padding = '5px 10px';
  versionIndicator.style.borderRadius = '4px';
  versionIndicator.style.fontSize = '12px';
  versionIndicator.textContent = 'MONGODB VERSION: Mar 18, 2025';
  document.body.appendChild(versionIndicator);
  
  // Set up event listeners with proper checks
  const loginFormElement = document.getElementById('login');
  if (loginFormElement) {
    loginFormElement.addEventListener('submit', handleLogin);
  } else {
    console.error("Login form not found");
  }
  
  const registerFormElement = document.getElementById('register');
  if (registerFormElement) {
    registerFormElement.addEventListener('submit', handleRegister);
  }
  
  const adminLoginFormElement = document.getElementById('adminLogin');
  if (adminLoginFormElement) {
    adminLoginFormElement.addEventListener('submit', handleAdminLogin);
  }
  
  const teamSelectionFormElement = document.getElementById('teamSelection');
  if (teamSelectionFormElement) {
    teamSelectionFormElement.addEventListener('submit', handleSubmitPicks);
  }
  
  // Other event listeners with checks
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
    });
  }
  
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      if (registerForm) registerForm.style.display = 'none';
      if (loginForm) loginForm.style.display = 'block';
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', handleAdminLogout);
  }
  
  // Admin functions
  if (updatePoolSettingsBtn) {
    updatePoolSettingsBtn.addEventListener('click', updatePoolSettings);
  }
  
  // Check if user is logged in
  if (token) {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchUserData();
    }
  }
  
  // Load initial teams data
  loadTeamsData();
}

// Authentication handlers
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    console.log("Attempting login for:", email);
    const response = await axios.post(`${API_URL}/login`, { email, password });
    console.log("Login response:", response);
    
    if (response.data && response.data.token) {
      token = response.data.token;
      localStorage.setItem('token', token);
      currentUser = response.data.user;
      isAdmin = response.data.user && response.data.user.isAdmin || false;
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
      
      if (isAdmin) {
        fetchAdminData();
      } else {
        showPicksInterface();
      }
    } else {
      console.error("Login response missing token:", response.data);
      alert('Login failed: Response missing authentication token');
    }
  } catch (error) {
    console.error("Login error details:", error);
    console.error("Response data:", error.response?.data);
    console.error("Status code:", error.response?.status);
    alert('Login failed: ' + (error.response?.data?.message || error.message || 'Unknown error'));
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  
  try {
    const response = await axios.post(`${API_URL}/register`, { email, password });
    alert('Registration successful! Please log in.');
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  } catch (error) {
    alert('Registration failed: ' + (error.response?.data?.message || 'Unknown error'));
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  
  try {
    // In a real app, you'd have a separate admin login endpoint
    // For the MVP, we'll simulate by checking for an admin email
    if (email.includes('admin')) {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      token = response.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('isAdmin', 'true');
      isAdmin = true;
      fetchAdminData();
    } else {
      alert('Not an admin account');
    }
  } catch (error) {
    alert('Admin login failed: ' + (error.response?.data?.message || 'Unknown error'));
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('isAdmin');
  token = null;
  currentUser = null;
  isAdmin = false;
  hideAllForms();
  loginForm.style.display = 'block';
}

function handleAdminLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('isAdmin');
  token = null;
  isAdmin = false;
  hideAllForms();
  loginForm.style.display = 'block';
}

function hideAllForms() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  pickForm.style.display = 'none';
  adminLoginForm.style.display = 'none';
  adminDashboard.style.display = 'none';
}

// Data fetching functions
async function fetchUserData() {
  try {
    const response = await axios.get(`${API_URL}/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    currentUser = response.data;
    showPicksInterface();
    fetchPreviousPicks();
  } catch (error) {
    console.error('Error fetching user data:', error);
    handleLogout();
  }
}

async function fetchAdminData() {
  try {
    hideAllForms();
    adminDashboard.style.display = 'block';
    
    // Fetch all users
    const usersResponse = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    allUsers = usersResponse.data.users || [];
    renderUsersList();
    
    // Fetch all picks
    const picksResponse = await axios.get(`${API_URL}/admin/picks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    allUserPicks = picksResponse.data.picks || [];
    renderAllPicks();
    
    // Fetch pool settings
    const settingsResponse = await axios.get(`${API_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (settingsResponse.data) {
      currentDay = settingsResponse.data.currentDay || 'Thursday';
      requiredPicks = settingsResponse.data.requiredPicks || 2;
      currentDaySelect.value = currentDay;
      requiredPicksInput.value = requiredPicks;
    }
  } catch (error) {
    console.error('Error fetching admin data:', error);
    
    // If there's an error (likely permissions), redirect to login
    handleAdminLogout();
  }
}

async function loadTeamsData() {
  try {
    if (token) {
      const response = await axios.get(`${API_URL}/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      allTeams = response.data.teams || [];
      
      if (!isAdmin) {
        fetchAvailableTeams();
      }
    }
  } catch (error) {
    console.error('Error loading teams data:', error);
  }
}

async function fetchAvailableTeams() {
  try {
    const response = await axios.get(`${API_URL}/teams/available`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    availableTeams = response.data.teams || [];
    
    // If editing, add back the teams from the current pick
    if (editingPickId) {
      const editingPick = previousPicks.find(pick => pick._id === editingPickId);
      if (editingPick) {
        const editingTeamIds = editingPick.teams.map(team => team._id);
        
        // For each team in the editing pick, add it to available teams if not already there
        editingPick.teams.forEach(editTeam => {
          const exists = availableTeams.some(team => team._id === editTeam._id);
          if (!exists) {
            availableTeams.push(editTeam);
          }
        });
      }
    }
    
    renderAvailableTeams();
  } catch (error) {
    console.error('Error fetching available teams:', error);
  }
}

async function fetchPreviousPicks() {
  try {
    const response = await axios.get(`${API_URL}/picks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    previousPicks = response.data.picks || [];
    
    renderPreviousPicks();
    fetchAvailableTeams();
  } catch (error) {
    console.error('Error fetching previous picks:', error);
  }
}

// Admin functions
async function updatePoolSettings() {
  const newDay = currentDaySelect.value;
  const newRequiredPicks = parseInt(requiredPicksInput.value);
  
  try {
    const response = await axios.put(`${API_URL}/admin/settings`, {
      currentDay: newDay,
      requiredPicks: newRequiredPicks
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    currentDay = newDay;
    requiredPicks = newRequiredPicks;
    
    alert('Pool settings updated successfully!');
  } catch (error) {
    alert('Failed to update pool settings: ' + (error.response?.data?.message || error.message));
  }
}

// UI rendering functions
function showPicksInterface() {
  hideAllForms();
  if (pickForm) {
    pickForm.style.display = 'block';
    
    // Display the user's email
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement && currentUser && currentUser.email) {
      userEmailElement.textContent = currentUser.email;
    }
  } else {
    console.error("Pick form element not found");
    return;
  }
  
  // Get current pool settings
  axios.get(`${API_URL}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(response => {
    if (response.data) {
      currentDay = response.data.currentDay || 'Thursday';
      requiredPicks = response.data.requiredPicks || 2;
      
      // Update pool info
      dayInfoSpan.textContent = `Current Day: ${currentDay}`;
      requiredInfoSpan.textContent = `Required Picks: ${requiredPicks}`;
    }
  })
  .catch(error => {
    console.error('Error getting pool settings:', error);
  });
  
  // Reset edit mode
  editingPickId = null;
  selectedTeams = [];
  
  // Load data
  fetchPreviousPicks();
}

function renderAvailableTeams() {
  availableTeamsDiv.innerHTML = '';
  
  if (availableTeams.length === 0) {
    availableTeamsDiv.innerHTML = '<p class="text-muted">No teams available</p>';
    return;

  }
  
  const teamsList = document.createElement('div');
  teamsList.className = 'list-group';
  
  availableTeams.forEach(team => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'list-group-item list-group-item-action';
    if (selectedTeams.some(t => t._id === team._id)) {
      item.classList.add('active');
    }
    item.textContent = `${team.seed}. ${team.name} (${team.region})`;
    item.onclick = () => toggleTeamSelection(team);
    teamsList.appendChild(item);
  });
  
  availableTeamsDiv.appendChild(teamsList);
  renderSelectedTeams();
}

function renderSelectedTeams() {
  selectedTeamsDiv.innerHTML = '';
  
  if (selectedTeams.length === 0) {
    selectedTeamsDiv.innerHTML = '<p class="text-muted">No teams selected</p>';
  } else {
    const teamsList = document.createElement('div');
    teamsList.className = 'list-group mb-3';
    
    selectedTeams.forEach(team => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      item.innerHTML = `
        ${team.seed}. ${team.name} (${team.region})
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeTeam('${team._id}')">
          Remove
        </button>
      `;
      teamsList.appendChild(item);
    });
    
    selectedTeamsDiv.appendChild(teamsList);
  }
  
  // Update submit button state and text
  submitPicksBtn.disabled = selectedTeams.length !== requiredPicks;
  submitPicksBtn.textContent = editingPickId ? 'Update Picks' : 'Submit Picks';
}

function renderPreviousPicks() {
  previousPicksDiv.innerHTML = '';
  
  if (previousPicks.length === 0) {
    previousPicksDiv.innerHTML = '<p class="text-muted">No previous picks</p>';
    return;
  }
  
  const picksList = document.createElement('div');
  picksList.className = 'list-group';
  
  // Sort picks with current day at the top
  const sortedPicks = [...previousPicks].sort((a, b) => {
    if (a.day === currentDay && b.day !== currentDay) return -1;
    if (a.day !== currentDay && b.day === currentDay) return 1;
    return new Date(b.date) - new Date(a.date);
  });
  
  sortedPicks.forEach(pick => {
    const item = document.createElement('div');
    item.className = 'list-group-item';
    
    const header = document.createElement('div');
    header.className = 'd-flex justify-content-between align-items-center';
    
    const title = document.createElement('h6');
    title.textContent = `${pick.day} - ${new Date(pick.date).toLocaleDateString()}`;
    
    const actionDiv = document.createElement('div');
    
    // Only show edit button for current day's picks
    if (pick.day === currentDay) {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-outline-primary me-2';
      editBtn.textContent = 'Edit';
      editBtn.onclick = () => editPicks(pick._id);
      actionDiv.appendChild(editBtn);
    }
    
    header.appendChild(title);
    header.appendChild(actionDiv);
    
    const teamsList = document.createElement('div');
    teamsList.className = 'd-flex flex-wrap gap-2 mt-2';
    
    pick.teams.forEach(team => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-primary';
      badge.textContent = team.name;
      teamsList.appendChild(badge);
    });
    
    item.appendChild(header);
    item.appendChild(teamsList);
    picksList.appendChild(item);
  });
  
  previousPicksDiv.appendChild(picksList);
}

function renderUsersList() {
  usersListDiv.innerHTML = '';
  
  if (allUsers.length === 0) {
    usersListDiv.innerHTML = '<p class="text-muted">No users found</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.className = 'table table-striped';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Email</th>
      <th>Buybacks</th>
      <th>Status</th>
    </tr>
  `;
  
  const tbody = document.createElement('tbody');
  
  allUsers.forEach(user => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.email}</td>
      <td>${user.buybacks}</td>
      <td>${user.eliminated ? '<span class="badge bg-danger">Eliminated</span>' : '<span class="badge bg-success">Active</span>'}</td>
    `;
    tbody.appendChild(row);
  });
  
  table.appendChild(thead);
  table.appendChild(tbody);
  usersListDiv.appendChild(table);
}

function renderAllPicks() {
  allPicksDiv.innerHTML = '';
  
  if (allUserPicks.length === 0) {
    allPicksDiv.innerHTML = '<p class="text-muted">No picks submitted yet</p>';
    return;
  }
  
  // Group picks by day
  const picksByDay = {};
  
  allUserPicks.forEach(pick => {
    if (!picksByDay[pick.day]) {
      picksByDay[pick.day] = [];
    }
    picksByDay[pick.day].push(pick);
  });
  
  // Create accordion for days
  const accordion = document.createElement('div');
  accordion.className = 'accordion';
  
  let index = 0;
  
  // Sort days in tournament order
  const tournamentDays = [
    'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Sweet16-1', 'Sweet16-2', 'Elite8-1', 'Elite8-2',
    'FinalFour', 'Championship'
  ];
  
  const sortedDays = Object.keys(picksByDay).sort((a, b) => {
    return tournamentDays.indexOf(a) - tournamentDays.indexOf(b);
  });
  
  sortedDays.forEach(day => {
    const picks = picksByDay[day];
    
    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    
    const headerId = `heading${index}`;
    const collapseId = `collapse${index}`;
    
    accordionItem.innerHTML = `
      <h2 class="accordion-header" id="${headerId}">
        <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${index === 0}" aria-controls="${collapseId}">
          ${day} (${picks.length} picks)
        </button>
      </h2>
      <div id="${collapseId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="${headerId}">
        <div class="accordion-body">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Teams</th>
                <th>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${picks.map(pick => `
                <tr>
                  <td>${pick.userEmail}</td>
                  <td>${pick.teams.map(team => `<span class="badge bg-primary me-1">${team.name}</span>`).join('')}</td>
                  <td>${new Date(pick.date).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    accordion.appendChild(accordionItem);
    index++;
  });
  
  allPicksDiv.appendChild(accordion);
  
  // We need to include Bootstrap JS for the accordion to work
  if (!document.getElementById('bootstrap-js')) {
    const script = document.createElement('script');
    script.id = 'bootstrap-js';
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js';
    document.body.appendChild(script);
  }
}

// Action handlers
function toggleTeamSelection(team) {
  const index = selectedTeams.findIndex(t => t._id === team._id);
  
  if (index > -1) {
    // Remove from selected teams
    selectedTeams.splice(index, 1);
  } else if (selectedTeams.length < requiredPicks) {
    // Add to selected teams
    selectedTeams.push(team);
  } else {
    // Already have maximum selections
    alert(`You can only select ${requiredPicks} teams for ${currentDay}`);
    return;
  }
  
  renderSelectedTeams();
  renderAvailableTeams(); // Re-render to update the active state
}

// Edit picks
function editPicks(pickId) {
  // Find the pick to edit
  const pickToEdit = previousPicks.find(pick => pick._id === pickId);
  
  if (!pickToEdit) {
    alert('Could not find the selected pick.');
    return;
  }
  
  editingPickId = pickId;
  selectedTeams = [...pickToEdit.teams];
  fetchAvailableTeams();
  
  window.scrollTo(0, 0);
  submitPicksBtn.textContent = 'Update Picks';
  
  // Remove any existing editing alerts
  const existingAlerts = document.querySelectorAll('.alert-warning');
  existingAlerts.forEach(alert => alert.remove());
  
  // Show alert that we're editing
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-warning alert-dismissible fade show mt-3';
  alertDiv.innerHTML = `
    Editing picks for ${pickToEdit.day}. 
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" onclick="cancelEdit()"></button>
  `;
  
  // Add the alert before the team selection form
  const teamSelectionForm = document.getElementById('teamSelection');
  teamSelectionForm.parentNode.insertBefore(alertDiv, teamSelectionForm);
}

// Cancel edit mode
window.cancelEdit = function() {
  editingPickId = null;
  selectedTeams = [];
  fetchAvailableTeams();
  submitPicksBtn.textContent = 'Submit Picks';
};

// Exposed to inline onclick handlers
window.removeTeam = function(teamId) {
  selectedTeams = selectedTeams.filter(team => team._id !== teamId);
  renderSelectedTeams();
};

async function handleSubmitPicks(e) {
  e.preventDefault();
  
  if (selectedTeams.length !== requiredPicks) {
    alert(`You must select exactly ${requiredPicks} teams for ${currentDay}`);
    return;
  }
  
  try {
    if (editingPickId) {
      // Update existing pick
      const response = await axios.put(`${API_URL}/picks/update`, {
        pickId: editingPickId,
        teams: selectedTeams
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Your picks have been updated!');
    } else {
      // Create new pick
      const response = await axios.post(`${API_URL}/picks/submit`, {
        teams: selectedTeams,
        day: currentDay
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Your picks have been submitted!');
    }
    
    // Reset and refresh
    editingPickId = null;
    selectedTeams = [];
    
    // Remove any editing alert
    const alerts = document.querySelectorAll('.alert-warning');
    alerts.forEach(alert => alert.remove());
    
    // Reset submit button
    submitPicksBtn.textContent = 'Submit Picks';
    
    // Refresh picks
    fetchPreviousPicks();
    
  } catch (error) {
    alert('Failed to submit picks: ' + (error.response?.data?.message || error.message));
  }
}
  
