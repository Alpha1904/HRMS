(function () {
  const NS = (window.HRMSRecruitment = window.HRMSRecruitment || {});
  const TOKEN = typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null;

function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Store user data globally for access by other scripts
let currentUser = null;
  const { toast, setLoading, qs, wireModalClose } = NS.ui;
  const { authMe, getProfile } = NS.api;

  async function checkAuth() {
    const token = TOKEN;
    
    if (!token) {
      return null;
    }

    try {
      const userData = parseJWT(token);
      if (!userData) {
        toast('Invalid token format.', 'error', 5000);
        return null;
      }
      
      // Fetch user profile to get fullName
      try {
        const profile = await getProfile(userData.profileId || userData.id);
        if (profile && profile.fullName) {
          userData.fullName = profile.fullName;
        }
      } catch (profileError) {
        console.warn('Could not fetch user profile:', profileError);
        // Continue with token data if profile fetch fails
      }
      
      // Store user data globally
      currentUser = userData;
      return userData;
    } catch (e) {
      toast(e.message || 'Auth check failed. Please verify your token.', 'error', 6000);
      return null;
    }
  }

  function wireHomeButton() {
    const btn = document.getElementById('home-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const dashboardUrl = getDashboardUrl();
      window.location.href = dashboardUrl;
    });
  }

  function wireLogout() {
    const btn = document.getElementById('logout-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      sessionStorage.removeItem('accessToken');
      toast('Logged out successfully.', 'success');
      setTimeout(() => window.location.reload(), 300);
    });
  }

  function setActiveNav() {
    const current = (document.body.getAttribute('data-page') || '').trim();
    if (!current) return;
    document.querySelectorAll('[data-nav]').forEach((a) => {
      const key = a.getAttribute('data-nav');
      const active = key === current;
      a.classList.toggle('bg-[rgb(242,101,34)]', active);
      a.classList.toggle('text-white', active);
      a.classList.toggle('hover:text-black', active);
    });
  }

  function init() {
    wireModalClose();
    wireLogout();
    wireHomeButton();
    setActiveNav();

    // Attempt auth check on load.
    checkAuth().then((me) => {
      const el = qs('#me-badge');
      if (!el) return;
      if (!me) {
        el.textContent = 'Not authenticated';
        el.className = 'text-xs px-2 py-1 rounded bg-amber-100 text-amber-800';
        return;
      }
      
      // Display user fullName and role
      const fullName = me.fullName || me.name || 'Unknown User';
      const role = me.role || 'Unknown Role';
      el.textContent = `${fullName} - ${role}`;
      el.className = 'text-xs px-2 py-1 rounded bg-gray-100 text-black';
      
      // Check page access after user data is loaded
      restrictPageAccess();
    });
  }

  function checkPageAccess() {
    if (!currentUser || !currentUser.role) {
      return false;
    }
    
    const role = currentUser.role.toLowerCase();
    const allowedRoles = ['hr_admin', 'recruiter', 'manager'];
    return allowedRoles.includes(role);
  }

  function restrictPageAccess() {
    const currentPage = document.body.getAttribute('data-page');
    const restrictedPages = ['jobs', 'candidates', 'documents'];
    
    if (restrictedPages.includes(currentPage) && !checkPageAccess()) {
      toast('Access denied. HR Admin and Recruiter roles only.', 'error', 5000);
      // Redirect to careers page (public) or dashboard
      const dashboardUrl = getDashboardUrl();
      setTimeout(() => {
        window.location.href = dashboardUrl;
      }, 1000);
      return false;
    }
    
    return true;
  }

  function getDashboardUrl() {
    if (!currentUser || !currentUser.role) {
      return '../dashboard.admin.html'; // fallback
    }
    
    const role = currentUser.role.toLowerCase();
    switch (role) {
      case 'hr_admin':
        return '../dashboard.admin.html';
      case 'manager':
        return '../dashboard.manager.html';
      case 'employee':
        return '../dashboard.employee.html';
      default:
        return '../dashboard.admin.html'; // fallback
    }
  }

  NS.app = {
    init,
    checkAuth,
    getCurrentUser: () => currentUser,
    getDashboardUrl,
    checkPageAccess,
    restrictPageAccess,
  };

  document.addEventListener('DOMContentLoaded', init);
})();
