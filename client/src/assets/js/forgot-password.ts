import { detectApiBase } from './fetch.js';

function onForgotPasswordPage() {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.querySelector('input[type="email"]') as HTMLInputElement | null;
    const email = input?.value?.trim() || '';
    if (!email) {
      alert('Please enter your email');
      return;
    }
    const API_BASE_URL = detectApiBase();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-pwd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        alert(data.message || 'Failed to send OTP');
        return;
      }
      sessionStorage.setItem('resetEmail', email);
      window.location.href = 'email-verification-2.html';
    } catch (err) {
      alert('Network error');
    }
  });
}

function onEmailVerificationPage() {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d1 = (document.getElementById('digit-1') as HTMLInputElement | null)?.value || '';
    const d2 = (document.getElementById('digit-2') as HTMLInputElement | null)?.value || '';
    const d3 = (document.getElementById('digit-3') as HTMLInputElement | null)?.value || '';
    const d4 = (document.getElementById('digit-4') as HTMLInputElement | null)?.value || '';
    const otp = `${d1}${d2}${d3}${d4}`.trim();
    if (!otp || otp.length < 4) {
      alert('Please enter the OTP');
      return;
    }
    sessionStorage.setItem('resetOtp', otp);
    window.location.href = 'reset-password-2.html';
  });
  const resend = document.querySelector('a.hover-a.text-primary');
  resend?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = sessionStorage.getItem('resetEmail') || '';
    if (!email) {
      alert('Email not found. Go back and enter your email.');
      return;
    }
    const API_BASE_URL = detectApiBase();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-pwd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert('OTP resent');
      } else {
        const data = await res.json().catch(() => ({} as any));
        alert(data.message || 'Failed to resend OTP');
      }
    } catch (_) {
      alert('Network error');
    }
  });
}

function onResetPasswordPage() {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pwdEl = document.querySelector('#passwordInput .pass-input') as HTMLInputElement | null;
    const confEl = document.querySelector('.pass-inputs') as HTMLInputElement | null;
    const password = pwdEl?.value || '';
    const confirm = confEl?.value || '';
    if (!password || !confirm) {
      alert('Enter password and confirm password');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    const email = sessionStorage.getItem('resetEmail') || '';
    const otp = sessionStorage.getItem('resetOtp') || '';
    if (!email || !otp) {
      alert('Missing email or OTP');
      return;
    }
    const API_BASE_URL = detectApiBase();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-pwd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        alert(data.message || 'Failed to reset password');
        return;
      }
      alert('Password reset successful');
      window.location.href = 'login.html';
    } catch (_) {
      alert('Network error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';
  if (path.endsWith('forgot-password-2.html')) onForgotPasswordPage();
  if (path.endsWith('email-verification-2.html')) onEmailVerificationPage();
  if (path.endsWith('reset-password-2.html')) onResetPasswordPage();
});