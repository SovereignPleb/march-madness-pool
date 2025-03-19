// DOM elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const pickForm = document.getElementById('pickForm');
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logout');
const dayInfoSpan = document.getElementById('dayInfo');
const requiredInfoSpan = document.getElementById('requiredInfo');
const availableTeamsDiv = document.getElementById('availableTeams');
const selectedTeamsDiv = document.getElementById('selectedTeams');
const previousPicksDiv = document.getElementById('previousPicks');
const submitPicksBtn = document.getElementById('submitPicks');

// Base API URL - change this to your Vercel deployment URL
const API_URL = window.location.origin + '/api';

// Application state
let token = localStorage.getItem('token');
let currentUser = null;
let availableTeams = [];
let selectedTeams = [];
let requiredPicks = 2;
let currentDay = 'Thursday';
let previousPicks = [];
let allTeams = [];

// Initialize the application
init();

function init() {
  // Set up event listeners
  document.getElementById('login').addEventListener('submit', handleLogin);
  document.getElementById('register').addEventListener('submit', handleRegister);
  document.getElementById('teamSelection').addEventListener('submit', handleSubmitPicks);
  showRegisterBtn.addEventListener('click', () => {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });
  showLoginBtn.addEventListener('click', () => {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });
  logoutBtn.addEventListener('click', handleLogout);
  
  // Check if user is logged in
  if (token) {
    fetchUserData();
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

function handleLogout() {
  localStorage.removeItem('token');
  token = null;
  currentUser = null;
  loginForm.style.display = 'block';
  pickForm.style.display = 'none';
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
    
    if (token) {
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
    availableTeams = allTeams.filter(team => !usedTeamIds.includes(team.id));
    renderAvailableTeams();
  } catch (error) {
    console.error('Error fetching available teams:', error);
  }
}

async function fetchPreviousPicks() {
  try {
    // In a real app, get this from your API
    // For the MVP, we'll use local storage
    const storedPicks = localStorage.getItem(`picks_${currentUser.email}`);
    previousPicks = storedPicks ? JSON.parse(storedPicks) : [];
    renderPreviousPicks();
    fetchAvailableTeams();
  } catch (error) {
    console.error('Error fetching previous picks:', error);
  }
}

// UI rendering functions
function showPicksInterface() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  pickForm.style.display = 'block';
  
  // Update pool info
  dayInfoSpan.textContent = `Current Day: ${currentDay}`;
  requiredInfoSpan.textContent = `Required Picks: ${requiredPicks}`;
  
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
  
  // Update submit button state
  submitPicksBtn.disabled = selectedTeams.length !== requiredPicks;
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
    
    const header = document.createElement('h6');
    header.textContent = `${pick.day} - ${new Date(pick.date).toLocaleDateString()}`;
    
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
}

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
    // In a real app, send this to your API
    // For the MVP, we'll store in localStorage
    const newPick = {
      day: currentDay,
      date: new Date().toISOString(),
      teams: selectedTeams
    };
    
    previousPicks.push(newPick);
    localStorage.setItem(`picks_${currentUser.email}`, JSON.stringify(previousPicks));
    
    alert('Your picks have been submitted!');
    selectedTeams = [];
    renderPreviousPicks();
    fetchAvailableTeams();
  } catch (error) {
    alert('Failed to submit picks: ' + error.message);
  }
}
