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
  // Set up event listeners
  document.getElementById('login').addEventListener('submit', handleLogin);
  document.getElementById('register').addEventListener('submit', handleRegister);
  document.getElementById('adminLogin').addEventListener('submit', handleAdminLogin);
  document.getElementById('teamSelection').addEventListener('submit', handleSubmitPicks);
  
  // Navigation listeners
  showRegisterBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });
  
  showLoginBtn.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });
  
  showAdminLoginBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    adminLoginForm.style.display = 'block';
  });
  
  backToLoginBtn.addEventListener('click', () => {
    adminLoginForm.style.display = 'none';
    loginForm.style.display = 'block';
  });
  
  logoutBtn.addEventListener('click', handleLogout);
  adminLogoutBtn.addEventListener('click', handleAdminLogout);
  
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
    const response = await axios.post(`${API_URL}/login`, { email, password });
    token = response.data.token;
    localStorage.setItem('token', token);
    currentUser = response.data.user;
    isAdmin = false;
    localStorage.setItem('isAdmin', 'false');
    showPicksInterface();
  } catch (error) {
    alert('Login failed: ' + (error.response?.data?.message || 'Unknown error'));
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
    
    // For MVP: If the admin endpoints don't exist yet, use mock data
    mockAdminData();
  }
}

function mockAdminData() {
  // Get all picks from localStorage
  let allPicks = [];
  const allPicksKey = 'all_picks';
  const storedAllPicks = localStorage.getItem(allPicksKey);
  
  if (storedAllPicks) {
    try {
      allPicks = JSON.parse(storedAllPicks);
    } catch (e) {
      console.error('Error parsing stored picks:', e);
    }
  }
  
  // Extract unique users from picks
  const userEmails = [...new Set(allPicks.map(pick => pick.userEmail))];
  
  // Generate user objects
  allUsers = userEmails.map(email => ({
    email: email,
    buybacks: 0,
    eliminated: false
  }));
  
  // If no users found, add mock users
  if (allUsers.length === 0) {
    allUsers = [
      { email: 'user1@example.com', buybacks: 0, eliminated: false },
      { email: 'user2@example.com', buybacks: 1, eliminated: false },
      { email: 'admin@example.com', buybacks: 0, eliminated: false }
    ];
  }
  
  // Use the existing picks or mock picks
  allUserPicks = allPicks.length > 0 ? allPicks : [
    {
      userEmail: 'user1@example.com',
      day: 'Thursday',
      date: new Date().toISOString(),
      teams: [
        { id: 1, name: 'Duke', seed: 1, region: 'East' },
        { id: 4, name: 'Houston', seed: 1, region: 'South' }
      ]
    },
    {
      userEmail: 'user2@example.com',
      day: 'Thursday',
      date: new Date().toISOString(),
      teams: [
        { id: 2, name: 'Alabama', seed: 2, region: 'East' },
        { id: 5, name: 'Tennessee', seed: 2, region: 'South' }
      ]
    }
  ];
  
  renderUsersList();
  renderAllPicks();
}

async function loadTeamsData() {
  try {
    // In a real app, this would come from your API
    // For the MVP, we'll use hardcoded data
    allTeams = [
      { id: 1, name: 'Duke', seed: 1, region: 'East' },
      { id: 2, name: 'Alabama', seed: 2, region: 'East' },
      { id: 3, name: 'Wisconsin', seed: 3, region: 'East' },
      { id: 4, name: 'Houston', seed: 1, region: 'South' },
      { id: 5, name: 'Tennessee', seed: 2, region: 'South' },
      { id: 6, name: 'Florida', seed: 1, region: 'West' },
      { id: 7, name: 'St. John\'s', seed: 2, region: 'West' },
      { id: 8, name: 'Auburn', seed: 1, region: 'Midwest' },
      { id: 9, name: 'Michigan State', seed: 2, region: 'Midwest' },
      { id: 10, name: 'Iowa State', seed: 3, region: 'Midwest' },
      { id: 11, name: 'Texas A&M', seed: 4, region: 'Midwest' },
      { id: 12, name: 'Michigan', seed: 5, region: 'Midwest' },
      { id: 13, name: 'Ole Miss', seed: 6, region: 'Midwest' },
      { id: 14, name: 'Marquette', seed: 7, region: 'Midwest' },
      { id: 15, name: 'Louisville', seed: 8, region: 'Midwest' },
      { id: 16, name: 'Creighton', seed: 9, region: 'Midwest' }
    ];
    
    if (token && !isAdmin) {
      fetchAvailableTeams();
    }
  } catch (error) {
    console.error('Error loading teams data:', error);
  }
}

async function fetchAvailableTeams() {
  try {
    // In a real app, this would filter based on user's previous picks from the API
    // For now, we'll simulate by removing teams from previous picks
    const usedTeamIds = previousPicks.flatMap(pick => pick.teams.map(team => team.id));
    
    // If editing, don't exclude the teams from the pick being edited
    if (editingPickId) {
      const editingPick = previousPicks.find(pick => pick.id === editingPickId);
      if (editingPick) {
        const editingTeamIds = editingPick.teams.map(team => team.id);
        availableTeams = allTeams.filter(team => 
          !usedTeamIds.includes(team.id) || editingTeamIds.includes(team.id)
        );
      }
    } else {
      availableTeams = allTeams.filter(team => !usedTeamIds.includes(team.id));
    }
    
    renderAvailableTeams();
  } catch (error) {
    console.error('Error fetching available teams:', error);
  }
}

async function fetchPreviousPicks() {
  try {
    // Get only this user's picks by filtering all picks from localStorage
    let allStoredPicks = [];
    
    // Get picks from centralized storage
    const allPicksKey = 'all_picks';
    const storedAllPicks = localStorage.getItem(allPicksKey);
    
    if (storedAllPicks) {
      try {
        allStoredPicks = JSON.parse(storedAllPicks);
      } catch (e) {
        console.error('Error parsing stored picks:', e);
        allStoredPicks = [];
      }
    }
    
    // Filter to only show current user's picks
    previousPicks = allStoredPicks.filter(pick => 
      pick.userEmail === currentUser.email
    );
    
    // Add unique IDs to picks if they don't have them
    previousPicks = previousPicks.map(pick => {
      if (!pick.id) {
        pick.id = Date.now() + Math.floor(Math.random() * 1000);
      }
      return pick;
    });
    
    // Sort picks by date
    previousPicks.sort((a, b) => new Date(b.date) - new Date(a.date));
    
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
    // In a real app, send to API
    // For MVP, store in localStorage
    localStorage.setItem('currentDay', newDay);
    localStorage.setItem('requiredPicks', newRequiredPicks);
    
    currentDay = newDay;
    requiredPicks = newRequiredPicks;
    
    alert('Pool settings updated successfully!');
  } catch (error) {
    alert('Failed to update pool settings: ' + error.message);
  }
}

// UI rendering functions
function showPicksInterface() {
  hideAllForms();
  pickForm.style.display = 'block';
  
  // Get pool settings from localStorage (in a real app, from API)
  const storedDay = localStorage.getItem('currentDay');
  const storedRequiredPicks = localStorage.getItem('requiredPicks');
  
  currentDay = storedDay || currentDay;
  requiredPicks = storedRequiredPicks ? parseInt(storedRequiredPicks) : requiredPicks;
  
  // Update pool info
  dayInfoSpan.textContent = `Current Day: ${currentDay}`;
  requiredInfoSpan.textContent = `Required Picks: ${requiredPicks}`;
  
  // Reset edit mode
  editingPickId = null;
  selectedTeams = [];
  
  // Load data
  fetchAvailableTeams();
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
    if (selectedTeams.some(t => t.id === team.id)) {
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
        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeTeam(${team.id})">
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
      editBtn.onclick = () => editPicks(pick.id);
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
  const index = selectedTeams.findIndex(t => t.id === team.id);
  
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
  const pickToEdit = previousPicks.find(pick => pick.id === pickId);
  
  if (!pickToEdit) {
    alert('Could not find the selected pick.');
    return;
  }
  
  // Verify ownership
  if (pickToEdit.userEmail !== currentUser.email) {
    alert('You can only edit your own picks!');
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
  selectedTeams = selectedTeams.filter(team => team.id !== teamId);
  renderSelectedTeams();
};

async function handleSubmitPicks(e) {
  e.preventDefault();
  
  if (selectedTeams.length !== requiredPicks) {
    alert(`You must select exactly ${requiredPicks} teams for ${currentDay}`);
    return;
  }
  
  try {
    // Get all existing picks from localStorage
    let allPicks = [];
    const allPicksKey = 'all_picks';
    const storedAllPicks = localStorage.getItem(allPicksKey);
    
    if (storedAllPicks) {
      try {
        allPicks = JSON.parse(storedAllPicks);
      } catch (e) {
        console.error('Error parsing stored picks:', e);
        allPicks = [];
      }
    }
    
    if (editingPickId) {
      // Update existing pick
      const pickIndex = allPicks.findIndex(pick => 
        pick.id === editingPickId && pick.userEmail === currentUser.email
      );
      
      if (pickIndex > -1) {
        allPicks[pickIndex].teams = selectedTeams;
        allPicks[pickIndex].date = new Date().toISOString();
      } else {
        alert('You can only edit your own picks!');
        return;
      }
    } else {
      // Create new pick
      const newPick = {
        id: Date.now(),
        day: currentDay,
        date: new Date().toISOString(),
        teams: selectedTeams,
        userEmail: currentUser.email
      };
      
      allPicks.push(newPick);
    }
    
    // Save all picks back to localStorage
    localStorage.setItem(allPicksKey, JSON.stringify(allPicks));
    
    // Refresh the user's picks
    await fetchPreviousPicks();
    
    // UI updates
    selectedTeams = [];
    const alerts = document.querySelectorAll('.alert-warning');
    alerts.forEach(alert => alert.remove());
    submitPicksBtn.textContent = 'Submit Picks';
    editingPickId = null;
    
    alert(editingPickId ? 'Your picks have been updated!' : 'Your picks have been submitted!');
  } catch (error) {
    alert('Failed to submit picks: ' + error.message);
  }
}
