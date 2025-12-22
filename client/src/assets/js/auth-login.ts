/**
 * Auth Login Module
 * Handles user login form submission and authentication flow
 */

import { handleResponse, detectApiBase } from './fetch.js';

const API_BASE_URL = detectApiBase();
const AUTH_LOGIN_URL = `${API_BASE_URL}/auth/login`;
const AUTH_ME_URL = `${API_BASE_URL}/auth/me`;
const LOGIN_FORM_SELECTOR = 'form[action="index.html"]';
const REQUEST_TIMEOUT_MS = 10000; // 10 second timeout for API requests
const REDIRECT_DELAY_MS = 500; // Delay before redirecting to dashboard

/**
 * Initialize login form handlers
 */
function setupLoginForm(): void {
  const form = document.querySelector(LOGIN_FORM_SELECTOR) as HTMLFormElement | null;
  if (!form) {
    console.warn('Login form not found');
    return;
  }

  // Get form elements
  const emailInput = form.querySelector('input[type="text"]') as HTMLInputElement | null;
  const passwordInput = form.querySelector('.pass-input') as HTMLInputElement | null;
  const rememberMeCheckbox = form.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
  const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;

  if (!emailInput || !passwordInput || !submitButton) {
    console.warn('Login form elements not found');
    return;
  }

  // Form submission
  form.addEventListener('submit', async (e: SubmitEvent): Promise<void> => {
    e.preventDefault();

    const email = emailInput.value?.trim() ?? '';
    const password = passwordInput.value ?? '';
    const rememberMe = rememberMeCheckbox?.checked ?? false;

    // Validation
    const validationError = validateLoginInputs(email, password);
    if (validationError) {
      showError(validationError);
      return;
    }

    await handleLogin(email, password, rememberMe, submitButton);
  });
}

/**
 * Validate login form inputs
 */
function validateLoginInputs(email: string, password: string): string | null {
  if (!email) {
    return 'Email address is required';
  }

  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }

  if (!password) {
    return 'Password is required';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get the appropriate dashboard URL based on user role
 */
function getDashboardByRole(role: string | undefined | null): string {
  const roleUpper = String(role ?? '').toUpperCase();

  switch (roleUpper) {
    case 'EMPLOYEE':
      return 'dashboard.employee.html';
    case 'MANAGER':
      return 'dashboard.manager.html';
    case 'ADMIN':
    case 'HR_ADMIN':
    case 'SYSTEM_ADMIN':
    case 'RECRUITER':
      return 'dashboard.admin.html';
    default:
      console.warn(`Unknown role: ${role}, defaulting to employee dashboard`);
      return 'dashboard.employee.html';
  }
}

/**
 * Interface for user profile from /api/auth/me
 */
interface CurrentUser {
  id?: number | string;
  role?: string;
  email?: string;
  user?: {
    id?: number | string;
    role?: string;
    email?: string;
  };
}

/**
 * Get authorization headers with token
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Get access token from storage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
}

/**
 * Fetch current user profile from /api/auth/me
 * This is called after login to determine the correct dashboard to redirect to
 * Returns user profile with id and role
 */
async function getCurrentUserRole(): Promise<CurrentUser> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(AUTH_ME_URL, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Failed to fetch current user profile:', response.status);
      return { role: 'EMPLOYEE' };
    }

    const user = (await response.json()) as CurrentUser;
    console.log('Current user:', user);

    const userId = user?.id ?? user?.user?.id;
    const userRole = user?.role ?? user?.user?.role ?? 'EMPLOYEE';
    return { id: userId, role: userRole };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Request timeout while fetching current user');
    } else {
      console.error('Error fetching current user:', error);
    }
    return { role: 'EMPLOYEE' };
  }
}

/**
 * Handle login submission
 */
async function handleLogin(
  email: string,
  password: string,
  rememberMe: boolean,
  submitButton: HTMLButtonElement,
): Promise<void> {
  const originalText = submitButton.textContent ?? '';
  submitButton.disabled = true;
  submitButton.textContent = 'Signing In...';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(AUTH_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      const errorMessage = (errorData.message as string) || `Login failed: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as Record<string, unknown>;
    console.log('Login successful');

    const loginResponseData = data as any;
    const roleFromResponse = loginResponseData?.user?.role ?? loginResponseData?.role;
    const idFromResponse = loginResponseData?.user?.id ?? loginResponseData?.id;
    const accessToken = loginResponseData?.accessToken as string | undefined;

    // Store access token
    if (accessToken) {
      sessionStorage.setItem('accessToken', accessToken);
    }

    // Fetch current user profile
    const userProfile = await getCurrentUserRole();
    let userRole = userProfile.role ?? 'EMPLOYEE';
    let userId = userProfile.id;

    // Prefer role from login response if needed
    if ((!userRole || userRole === 'EMPLOYEE') && roleFromResponse) {
      userRole = String(roleFromResponse).toUpperCase();
    }

    if (!userId && idFromResponse) {
      userId = idFromResponse;
    }

    console.log('User authenticated with role:', userRole);
    if (userId) {
      console.log('User ID:', userId);
    }

    // Store user profile in localStorage
    localStorage.setItem('currentUserRole', String(userRole));
    if (userId) {
      localStorage.setItem('currentUserId', String(userId));
    }

    // Handle remember me preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('rememberedEmail');
    }

    // Show success and redirect
    showSuccess('Login successful! Redirecting...');
    const dashboard = getDashboardByRole(userRole);
    console.log('Redirecting to:', dashboard);

    setTimeout(() => {
      window.location.href = dashboard;
    }, REDIRECT_DELAY_MS);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : error instanceof DOMException && error.name === 'AbortError'
        ? 'Request timeout. Please try again.'
        : 'An error occurred during login';
    
    console.error('Login error:', errorMessage);
    showError(errorMessage);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * Show error message
 */
function showError(message: string): void {
  console.error('Login Error:', message);

  // Remove existing error message
  const existingError = document.querySelector('.login-error-message');
  if (existingError) {
    existingError.remove();
  }

  // Create and insert error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'login-error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
  errorDiv.textContent = message;
  errorDiv.setAttribute('role', 'alert'); // For accessibility

  const form = document.querySelector(LOGIN_FORM_SELECTOR);
  if (form) {
    form.insertBefore(errorDiv, form.firstChild);
  }
}

/**
 * Show success message
 */
function showSuccess(message: string): void {
  console.log('Login Success:', message);

  const successDiv = document.createElement('div');
  successDiv.className = 'login-success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
  successDiv.textContent = message;
  successDiv.setAttribute('role', 'status'); // For accessibility

  const form = document.querySelector(LOGIN_FORM_SELECTOR);
  if (form) {
    form.insertBefore(successDiv, form.firstChild);
  }
}

/**
 * Pre-fill email if "Remember Me" was previously checked
 */
function restoreRememberedEmail(): void {
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  const rememberedEmail = localStorage.getItem('rememberedEmail');

  if (rememberMe && rememberedEmail) {
    const emailInput = document.querySelector('input[type="text"]') as HTMLInputElement | null;
    const rememberMeCheckbox = document.querySelector('input[type="checkbox"]') as HTMLInputElement | null;

    if (emailInput) {
      emailInput.value = rememberedEmail;
    }
    if (rememberMeCheckbox) {
      rememberMeCheckbox.checked = true;
    }
  }
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', (): void => {
  console.log('Auth login module loaded');
  restoreRememberedEmail();
  setupLoginForm();
});

export async function enforceAuthenticatedRoute(
  redirectUrl: string = 'login-2.html',
  allowedRoles?: string[],
): Promise<void> {
  try {
    const token = getAccessToken();
    const headers = getAuthHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(AUTH_ME_URL, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('User not authenticated. Redirecting to login...');
      window.location.href = redirectUrl;
      return;
    }

    const user = (await response.json()) as CurrentUser;
    const userId = user?.id ?? user?.user?.id;
    const userRole = String(user?.role ?? user?.user?.role ?? '').toUpperCase();

    // Store user data
    if (userId) {
      localStorage.setItem('currentUserId', String(userId));
      console.log('User authenticated with ID:', userId);
    }
    if (userRole) {
      localStorage.setItem('currentUserRole', userRole);
    }

    // Check allowed roles
    if (allowedRoles && allowedRoles.length > 0) {
      const roles = allowedRoles.map((r) => String(r).toUpperCase());
      if (!roles.includes(userRole)) {
        console.warn(`User role ${userRole} not in allowed roles:`, allowedRoles);
        window.location.href = redirectUrl;
        return;
      }
    }

    console.log('User authorized. Access granted.');
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error checking authentication:', errorMsg);
    window.location.href = redirectUrl;
  }
}

(window as any).enforceAuthenticatedRoute = enforceAuthenticatedRoute;

/**
 * Helper function to check if user is authenticated
 * Returns true if authenticated, false otherwise
 * Does NOT redirect - use enforceAuthenticatedRoute() for automatic redirect
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const headers = getAuthHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(AUTH_ME_URL, {
      method: 'GET',
      headers,
      credentials: 'include',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

(window as any).isUserAuthenticated = isUserAuthenticated;
