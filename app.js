// Simplified March Madness Pool app.js
// DOM elements - Main UI
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const pickForm = document.getElementById('pickForm');

// Navigation buttons
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logout');

// User interface elements
const dayInfoSpan = document.getElementById('dayInfo');
const requiredInfoSpan = document.getElementById('requiredInfo');
const availableTeamsDiv = document.getElementById('availableTeams');
const selectedTeamsDiv = document.getElementById('selectedTeams');
const previousPicksDiv = document.getElementById('previousPicks');
const submitPicksBtn = document.getElementById('submitPicks');

// Application state
let token = localStorage.getItem('token');
let currentUser = null;
let availableTeams = [];
let selectedTeams = [];
let requiredPicks = 2;
let currentDay = 'Thursday';
let previousPicks = [];
let allTeams = [];
let editingPickId = null;

// Initialize the application
init();

function init() {
  console.log("Running SIMPLIFIED version - March 18, 2025");
  
  // Add a visible indicator
  const versionIndicator = document.createElement('div');
  versionIndicator.style.position = 'fixed';
  versionIndicator.style.bottom = '10px';
  versionIndicator.style.right = '10px';
  versionIndicator.style.background = '#ff5722';
  versionIndicator.style.color = 'white';
  versionIndicator.style.padding = '5px 10px';
  versionIndicator.style.borderRadius = '4px';
  versionIndicator.style.fontSize = '12px';
  versionIndicator.textContent = 'SIMPLIFIED VERSION: Mar 18, 2025';
  document.body.appendChild(versionIndicator);
  
  // Set up event listeners with console logging
  if (document.getElementById('login')) {
    console.log("Login form found, adding listener");
    document.getElementById('login').addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Login button clicked");
      handleLogin(e);
    });
  } else {
    console.log("ERROR: Login form not found");
  }
  
  if (document.getElementById('register')) {
    document.getElementById('register').addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Register button clicked");
      handleRegister(e);
    });
  }
  
  if (document.getElementById('teamSelection')) {
    document.getElementById('teamSelection').addEventListener('submit', function(e) {
      e.preventDefault();
      console.log("Submit picks button clicked");
      handleSubmitPicks(e);
    });
  }
  
  // Navigation listeners
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => {
      console.log("Show register clicked");
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    });
  }
  
  if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
      console.log("Show login clicked");
      registerForm.style.display = 'none';
      loginForm.style.display = 'block';
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Check if user is logged in
  if (token) {
    console.log("Token found, fetching user data");
    fetchUserData();
  } else {
    console.log("No token found, showing login form");
  }
  
  // Load initial teams data
  loadTeamsData();
}

// Authentication handlers
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  console.log("Login attempt for:", email);
  
  try {
    // For testing - bypass the API
    alert(`Login successful for ${email}`);
    token = "dummy-token";
    localStorage.setItem('token', token);
    currentUser = { email: email };
    showPicksInterface();
    return;
    
    /* Commented out API call for now
    const response = await axios.post(`/api/login`, { email, password });
    token = response.data.token;
    localStorage.setItem('token', token);
    currentUser = response.data.user;
    showPicksInterface();
    */
  } catch (error) {
    console.error("Login error:", error);
    alert('Login failed: ' + (error.response?.data?.message || 'Unknown error'));
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  
  console.log("Registration attempt for:", email);
  
  try {
    // For testing - bypass the API
    alert(`Registration successful for ${email}! Please log in.`);
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    return;
    
    /* Commented out API call for now
    const response = await axios.post(`/api/register`, { email, password });
    alert('Registration successful! Please log in.');
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
    */
  } catch (error) {
    console.error("Registration error:", error);
    alert('Registration failed: ' + (error.response?.data?.message || 'Unknown error'));
  }
}

function handleLogout() {
  console.log("Logout clicked");
  localStorage.removeItem('token');
  token = null;
  currentUser = null;
  loginForm.style.display = 'block';
  pickForm.style.display = 'none';
}

// Data handling functions
async function fetchUserData() {
  try {
    console.log("Fetching user data...");
    // For testing - bypass API
    currentUser = { email: "test@example.com" };
    showPicksInterface();
    loadFakeData();
    
    /* Commented out API call for now
    const response = await axios.get(`/api/user`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    currentUser = response.data;
    showPicksInterface();
    fetchPreviousPicks();
    */
  } catch (error) {
    console.error("Error fetching user data:", error);
    handleLogout();
  }
}

async function loadTeamsData() {
  try {
    console.log("Loading teams data...");
    // Hardcoded teams data for testing
    allTeams = [
      { _id: "1", name: 'Duke', seed: 1, region: 'East' },
      { _id: "2", name: 'Alabama', seed: 2, region: 'East' },
      { _id: "3", name: 'Wisconsin', seed: 3, region: 'East' },
      { _id: "4", name: 'Houston', seed: 1, region: 'South' },
      { _id: "5", name: 'Tennessee', seed: 2, region: 'South' },
      { _id: "6", name: 'Florida', seed: 1, region: 'West' },
      { _id: "7", name: 'St. John\'s', seed: 2, region: 'West' },
      { _id: "8", name: 'Auburn', seed: 1, region: 'Midwest' }
    ];
    
    availableTeams = [...allTeams];
  } catch (error) {
    console.error("Error loading teams data:", error);
  }
}

function loadFakeData() {
  // Load some fake previous picks for testing
  previousPicks = [
    {
      _id: "pick1",
      day: "Thursday",
      date: new Date().toISOString(),
      userEmail: currentUser.email,
      teams: [
        { _id: "1", name: 'Duke', seed: 1, region: 'East' },
        { _id: "4", name: 'Houston', seed: 1, region: 'South' }
      ]
    }
  ];
  
  renderPreviousPicks();
  renderAvailableTeams();
}

// UI functions
function showPicksInterface() {
  console.log("Showing picks interface");
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  pickForm.style.display = 'block';
  
  // Update pool info
  dayInfoSpan.textContent = `Current Day: ${currentDay}`;
  requiredInfoSpan.textContent = `Required Picks: ${requiredPicks}`;
  
  // Reset edit mode
  editingPickId = null;
  selectedTeams = [];
  
  renderAvailableTeams();
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
  
  previousPicks.forEach(pick => {
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
  
  renderAvailableTeams();
}

// Cancel edit mode
window.cancelEdit = function() {
  editingPickId = null;
  selectedTeams = [];
  renderAvailableTeams();
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
    console.log("Submitting picks:", selectedTeams);
    
    if (editingPickId) {
      // Update existing pick in our local array for testing
      const pickIndex = previousPicks.findIndex(pick => pick._id === editingPickId);
      if (pickIndex > -1) {
        previousPicks[pickIndex].teams = selectedTeams;
        previousPicks[pickIndex].date = new Date().toISOString();
      }
      
      alert('Your picks have been updated!');
    } else {
      // Create new pick for testing
      const newPick = {
        _id: "pick" + Date.now(),
        day: currentDay,
        date: new Date().toISOString(),
        teams: selectedTeams,
        userEmail: currentUser.email
      };
      
      previousPicks.push(newPick);
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
    renderPreviousPicks();
    renderAvailableTeams();
    
  } catch (error) {
    console.error("Error submitting picks:", error);
    alert('Failed to submit picks: ' + error.message);
  }
}
