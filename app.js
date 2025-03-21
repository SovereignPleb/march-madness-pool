// DOM elements - Main UI
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const pickForm = document.getElementById('pickForm');
const adminLoginForm = document.getElementById('adminLoginForm') || null;
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
const teamOptionsDiv = document.getElementById('teamOptions') || document.createElement('div');
const saveTeamOptionsBtn = document.getElementById('saveTeamOptions') || document.createElement('button');

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
  console.log("Running MONGODB version - March 20, 2025");
  
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
  versionIndicator.textContent = 'MONGODB VERSION: Mar 20, 2025';
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
  
  // Add event listener for day change in admin panel
  if (currentDaySelect) {
    currentDaySelect.addEventListener('change', handleDayChange);
  }
  
  // Add global variables to window for debugging
  window.app = {
    allTeams,
    availableTeams,
    currentDay,
    requiredPicks,
    selectedTeams,
    previousPicks,
    allUsers,
    allUserPicks
  };
  
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

// New function to handle day change in admin panel
function handleDayChange(e) {
  const newDay = e.target.value;
  console.log(`Admin is changing day to: ${newDay}`);
  
  // Show a confirmation dialog
  if (confirm(`Are you sure you want to change the current day to ${newDay}? This will update available teams for all users.`)) {
    // The actual update will happen in updatePoolSettings()
    // This is just to provide feedback about the change
    const dayChangeAlert = document.createElement('div');
    dayChangeAlert.className = 'alert alert-warning alert-dismissible fade show mt-3';
    dayChangeAlert.innerHTML = `
      <strong>Day Change Pending:</strong> Changing to ${newDay}. Click "Update Pool Settings" to confirm.
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add the alert before the settings form
    const settingsForm = document.querySelector('.admin-settings');
    if (settingsForm) {
      settingsForm.insertBefore(dayChangeAlert, settingsForm.firstChild);
    } else {
      adminDashboard.insertBefore(dayChangeAlert, adminDashboard.firstChild);
    }
  } else {
    // Reset to previous value if canceled
    e.target.value = currentDay;
  }
}

function hideAllForms() {
  if (loginForm) loginForm.style.display = 'none';
  if (registerForm) registerForm.style.display = 'none';
  if (pickForm) pickForm.style.display = 'none';
  if (adminLoginForm) adminLoginForm.style.display = 'none';
  if (adminDashboard) adminDashboard.style.display = 'none';
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
    
    // Fetch all teams for team options management
    const teamsResponse = await axios.get(`${API_URL}/teams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    allTeams = teamsResponse.data.teams || [];
    
    // Check if team options management elements exist in the HTML
    if (!document.getElementById('teamOptions')) {
      // Create team options section if it doesn't exist
      createTeamOptionsSection();
    }
    
    // Render team options management interface
    renderTeamOptionsManager();
    
  } catch (error) {
    console.error('Error fetching admin data:', error);
    
    // If there's an error (likely permissions), redirect to login
    handleAdminLogout();
  }
}

async function loadTeamsData() {
  try {
    if (token) {
      // Get the current day from the server to ensure we have the latest
      const settingsResponse = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (settingsResponse.data) {
        currentDay = settingsResponse.data.currentDay || 'Thursday';
      }
      
      // Request teams with the day parameter to get day-specific teams
      const response = await axios.get(`${API_URL}/teams?day=${currentDay}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      allTeams = response.data.teams || [];
      console.log(`Loaded ${allTeams.length} teams for ${currentDay}`);
      
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
    // Request available teams with specific day parameter
    const response = await axios.get(`${API_URL}/teams/available?day=${currentDay}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    availableTeams = response.data.teams || [];
    console.log(`Fetched ${availableTeams.length} available teams for ${currentDay}`);
    
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
    
    // If no teams available for the current day, try without day parameter as fallback
    if (availableTeams.length === 0) {
      console.log(`No teams found for ${currentDay}, trying fallback...`);
      const fallbackResponse = await axios.get(`${API_URL}/teams/available`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      availableTeams = fallbackResponse.data.teams || [];
      console.log(`Fallback: Fetched ${availableTeams.length} teams`);
    }
    
    renderAvailableTeams();
  } catch (error) {
    console.error('Error fetching available teams:', error);
    
    // If API fails, use allTeams as fallback
    if (allTeams && allTeams.length > 0) {
      console.log('Using allTeams as fallback for available teams');
      availableTeams = [...allTeams];
      renderAvailableTeams();
    }
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
    
    const dayChanged = currentDay !== newDay;
    currentDay = newDay;
    requiredPicks = newRequiredPicks;
    
    // Refresh team data if day has changed
    if (dayChanged) {
      await refreshTeamsForNewDay(newDay);
    }
    
    alert('Pool settings updated successfully!');
    
    // Refresh admin data to show the updated information
    fetchAdminData();
  } catch (error) {
    alert('Failed to update pool settings: ' + (error.response?.data?.message || error.message));
  }
}

// New function to refresh teams for a new day
async function refreshTeamsForNewDay(newDay) {
  try {
    console.log(`Refreshing teams for new day: ${newDay}`);
    
    // First, check if the API endpoint exists
    let response;
    try {
      // Call the API to refresh teams for the new day
      response = await axios.post(`${API_URL}/admin/refresh-teams`, {
        day: newDay
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (apiError) {
      console.warn('API endpoint /admin/refresh-teams not found, using fallback method:', apiError);
      
      // Fallback: Use the existing teams endpoint with a day parameter
      response = await axios.get(`${API_URL}/teams?day=${newDay}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Also update the available teams for all users
      await axios.post(`${API_URL}/admin/update-day`, {
        day: newDay
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
    
    console.log('Teams refreshed successfully:', response.data);
    
    // Update local team data
    if (response.data.teams) {
      allTeams = response.data.teams;
    }
    
    return true;
  } catch (error) {
    console.error('Error refreshing teams for new day:', error);
    alert('Failed to refresh teams for the new day: ' + (error.response?.data?.message || error.message));
    return false;
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

  // Disable submit button if picks for current day already exist
  const existingDayPick = previousPicks.find(pick => pick.day === currentDay);
  if (existingDayPick && !editingPickId) {
    const existingPickAlert = document.createElement('div');
    existingPickAlert.className = 'alert alert-info mt-3';
    existingPickAlert.textContent = `You have already submitted picks for ${currentDay}. You can only edit your existing picks.`;
    
    previousPicksDiv.insertBefore(existingPickAlert, previousPicksDiv.firstChild);
  }

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

// Create the team options management section
function createTeamOptionsSection() {
  console.log("Creating team options section");
  
  // Find the admin settings section to append after
  const adminSettingsSection = document.querySelector('.admin-settings') || 
                              document.querySelector('.card') || 
                              adminDashboard.firstElementChild;
  
  if (!adminSettingsSection) {
    console.error("Could not find admin settings section");
    return;
  }
  
  // Create a new card for team options
  const teamOptionsCard = document.createElement('div');
  teamOptionsCard.className = 'card mt-4';
  teamOptionsCard.innerHTML = `
    <div class="card-header">
      <h5>Team Options by Day</h5>
    </div>
    <div class="card-body">
      <div id="teamOptions" class="mb-3">
        <!-- Team options table will be rendered here -->
      </div>
      <button id="saveTeamOptions" class="btn btn-primary">Save Team Options</button>
    </div>
  `;
  
  // Insert after the admin settings section
  adminSettingsSection.parentNode.insertBefore(teamOptionsCard, adminSettingsSection.nextSibling);
  
  // Update the global references
  teamOptionsDiv = document.getElementById('teamOptions');
  saveTeamOptionsBtn = document.getElementById('saveTeamOptions');
  
  // Add event listener for saving team options
  saveTeamOptionsBtn.addEventListener('click', saveTeamOptionsByDay);
}

// Render the team options manager interface
function renderTeamOptionsManager() {
  if (!teamOptionsDiv) {
    console.error("Team options div not found");
    return;
  }
  
  console.log("Rendering team options manager with", allTeams.length, "teams");
  
  // If no teams available yet, show a message
  if (!allTeams || allTeams.length === 0) {
    teamOptionsDiv.innerHTML = '<div class="alert alert-info">Loading teams data...</div>';
    return;
  }
  
  // Define tournament days
  const tournamentDays = [
    'Thursday', 'Friday', 'Saturday', 'Sunday',
    'Sweet16-1', 'Sweet16-2', 'Elite8-1', 'Elite8-2',
    'FinalFour', 'Championship'
  ];
  
  // Create direct HTML content instead of DOM manipulation
  let html = `
    <div class="mb-3">
      <select id="daySelector" class="form-select mb-3">
  `;
  
  // Add options for each day
  tournamentDays.forEach(day => {
    html += `<option value="${day}" ${day === currentDay ? 'selected' : ''}>${day}</option>`;
  });
  
  html += `
      </select>
      
      <div class="mb-3">
        <button class="btn btn-sm btn-outline-primary me-2" onclick="selectAllTeams()">Select All</button>
        <button class="btn btn-sm btn-outline-secondary me-2" onclick="deselectAllTeams()">Deselect All</button>
        <button class="btn btn-sm btn-outline-info" onclick="toggleTopSeeds()">Toggle Seeds 1-4</button>
      </div>
      
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Include</th>
            <th>Seed</th>
            <th>Team</th>
            <th>Region</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Add a row for each team
  allTeams.forEach(team => {
    // Check if this team is available for the current day
    const isAvailable = team.availableDays && team.availableDays.includes(currentDay);
    
    html += `
      <tr>
        <td>
          <input type="checkbox" class="form-check-input team-checkbox" 
                 data-team-id="${team._id}" 
                 ${isAvailable ? 'checked' : ''}>
        </td>
        <td>${team.seed}</td>
        <td>${team.name}</td>
        <td>${team.region}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  // Set the HTML content
  teamOptionsDiv.innerHTML = html;
  
  // Add event listener for day selector
  const daySelector = document.getElementById('daySelector');
  if (daySelector) {
    daySelector.addEventListener('change', function() {
      currentDay = this.value;
      renderTeamOptionsManager();
    });
  }
}

// Handler for saving team options by day
async function saveTeamOptionsByDay() {
  try {
    // Collect team day availability data
    const teamDayAvailability = {};
    
    // For each day, collect all selected team IDs
    const days = [
      'Thursday', 'Friday', 'Saturday', 'Sunday',
      'Sweet16-1', 'Sweet16-2', 'Elite8-1', 'Elite8-2',
      'FinalFour', 'Championship'
    ];
    
    days.forEach(day => {
      const checkboxes = document.querySelectorAll(`input[data-day="${day}"]:checked`);
      teamDayAvailability[day] = Array.from(checkboxes).map(cb => cb.dataset.teamId);
    });
    
    console.log('Saving team day availability:', teamDayAvailability);
    
    // Send to the server
    const response = await axios.post(`${API_URL}/admin/team-availability`, {
      teamDayAvailability
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    alert('Team options saved successfully!');
    
    // Refresh team data
    loadTeamsData();
    
  } catch (error) {
    console.error('Error saving team options:', error);
    alert('Failed to save team options: ' + (error.response?.data?.message || error.message));
  }
}

// Helper functions for team selection
window.selectAllTeams = function(day) {
  const checkboxes = document.querySelectorAll(`input[data-day="${day}"]`);
  checkboxes.forEach(cb => cb.checked = true);
};

window.deselectAllTeams = function(day) {
  const checkboxes = document.querySelectorAll(`input[data-day="${day}"]`);
  checkboxes.forEach(cb => cb.checked = false);
};

window.toggleWinningTeams = function(day) {
  // Select teams with seeds 1-4 (typically winners/favorites)
  const rows = document.querySelectorAll(`#pane-${day} tbody tr`);
  
  rows.forEach(row => {
    const seedCell = row.cells[1];
    const checkbox = row.querySelector('input[type="checkbox"]');
    
    if (seedCell && checkbox) {
      const seedNumber = parseInt(seedCell.textContent);
      if (!isNaN(seedNumber) && seedNumber >= 1 && seedNumber <= 4) {
        checkbox.checked = !checkbox.checked;
      }
    }
  });
};

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

  // Check if user has already made picks for this day
  const existingDayPick = previousPicks.find(pick => 
    pick.day === currentDay && (!editingPickId || pick._id !== editingPickId)
  );
  
  if (existingDayPick && !editingPickId) {
    alert(`You have already submitted picks for ${currentDay}. You can only edit your existing picks.`);
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
