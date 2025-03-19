// Update the showPicksInterface function to display the user's email
function showPicksInterface() {
  console.log("Showing picks interface");
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
  
  // Rest of the function remains the same...
  // Get current pool settings
  axios.get(`${API_URL}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(response => {
    console.log("Pool settings response:", response.data);
    if (response.data) {
      currentDay = response.data.currentDay || 'Thursday';
      requiredPicks = response.data.requiredPicks || 2;
      
      // Update pool info
      if (dayInfoSpan) dayInfoSpan.textContent = `Current Day: ${currentDay}`;
      if (requiredInfoSpan) requiredInfoSpan.textContent = `Required Picks: ${requiredPicks}`;
    }
  })
  .catch(error => {
    console.error("Error getting pool settings:", error);
  });
  
  // Reset edit mode
  editingPickId = null;
  selectedTeams = [];
  
  // Load data
  fetchPreviousPicks();
}

// Update the fetchAdminData function to display the admin's email
async function fetchAdminData() {
  try {
    console.log("Fetching admin data...");
    hideAllForms();
    if (adminDashboard) {
      adminDashboard.style.display = 'block';
      
      // Display the admin's email
      const adminEmailElement = document.getElementById('adminEmail');
      if (adminEmailElement && currentUser && currentUser.email) {
        adminEmailElement.textContent = currentUser.email;
      }
      
    } else {
      console.error("Admin dashboard element not found");
      return;
    }
    
    // Rest of the function remains the same...
    // Fetch all users
    const usersResponse = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Admin users response:", usersResponse.data);
    
    allUsers = usersResponse.data.users || [];
    renderUsersList();
    
    // Fetch all picks
    const picksResponse = await axios.get(`${API_URL}/admin/picks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Admin picks response:", picksResponse.data);
    
    allUserPicks = picksResponse.data.picks || [];
    renderAllPicks();
    
    // Fetch pool settings
    const settingsResponse = await axios.get(`${API_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Admin settings response:", settingsResponse.data);
    
    if (settingsResponse.data) {
      currentDay = settingsResponse.data.currentDay || 'Thursday';
      requiredPicks = settingsResponse.data.requiredPicks || 2;
      
      if (currentDaySelect) currentDaySelect.value = currentDay;
      if (requiredPicksInput) requiredPicksInput.value = requiredPicks;
    }
  } catch (error) {
    console.error("Error fetching admin data:", error);
    
    // If there's an error (likely permissions), redirect to login
    handleAdminLogout();
  }
}
