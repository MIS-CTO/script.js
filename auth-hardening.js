// ============================================================================
// AUTH HARDENING - Rate Limiting + Session Expiry
// Culture Over Money Management System
// Version: 1.0.0 | 2026-01-10
// ============================================================================
//
// USAGE: Include this script BEFORE the main application script
// <script src="auth-hardening.js"></script>
//
// Then call these functions from your existing code:
// - checkLoginRateLimit() before login attempt
// - recordLoginAttempt(success) after login result
// - saveSession(userData) after successful login
// - isSessionValid() to check session validity
// - checkSessionOnLoad() at app initialization
//
// ============================================================================

(function(window) {
  'use strict';

  // ========================================
  // RATE LIMITING
  // ========================================
  
  const RATE_LIMIT_CONFIG = {
    maxAttempts: 5,           // Max login attempts
    windowMs: 60000,          // 1 minute window
    lockoutMs: 300000         // 5 minute lockout after max attempts
  };

  // State stored in localStorage to persist across page reloads
  function getLoginAttempts() {
    try {
      const stored = localStorage.getItem('_loginAttempts');
      if (!stored) return { count: 0, lastAttempt: null, lockedUntil: null };
      return JSON.parse(stored);
    } catch {
      return { count: 0, lastAttempt: null, lockedUntil: null };
    }
  }

  function setLoginAttempts(attempts) {
    localStorage.setItem('_loginAttempts', JSON.stringify(attempts));
  }

  /**
   * Check if login is allowed (rate limit not exceeded)
   * @returns {{ allowed: boolean, message?: string, remainingSeconds?: number }}
   */
  function checkLoginRateLimit() {
    const now = Date.now();
    const attempts = getLoginAttempts();
    
    // Check if currently locked out
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
      const remainingSeconds = Math.ceil((attempts.lockedUntil - now) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return { 
        allowed: false, 
        message: `Zu viele Fehlversuche. Bitte warte ${remainingMinutes > 1 ? remainingMinutes + ' Minuten' : remainingSeconds + ' Sekunden'}.`,
        remainingSeconds 
      };
    }
    
    // Reset counter if window has passed
    if (attempts.lastAttempt && (now - attempts.lastAttempt) > RATE_LIMIT_CONFIG.windowMs) {
      setLoginAttempts({ count: 0, lastAttempt: null, lockedUntil: null });
    }
    
    return { allowed: true };
  }

  /**
   * Record a login attempt (success or failure)
   * @param {boolean} success - Whether the login was successful
   */
  function recordLoginAttempt(success) {
    const now = Date.now();
    const attempts = getLoginAttempts();
    
    if (success) {
      // Reset on successful login
      setLoginAttempts({ count: 0, lastAttempt: null, lockedUntil: null });
    } else {
      // Increment failure count
      const newCount = attempts.count + 1;
      const newAttempts = {
        count: newCount,
        lastAttempt: now,
        lockedUntil: null
      };
      
      // Lock out if max attempts reached
      if (newCount >= RATE_LIMIT_CONFIG.maxAttempts) {
        newAttempts.lockedUntil = now + RATE_LIMIT_CONFIG.lockoutMs;
        console.warn(`[Auth] Rate limit exceeded. Locked until ${new Date(newAttempts.lockedUntil).toLocaleTimeString()}`);
      }
      
      setLoginAttempts(newAttempts);
    }
  }

  // ========================================
  // SESSION EXPIRY
  // ========================================
  
  const SESSION_CONFIG = {
    expiryMs: 24 * 60 * 60 * 1000,    // 24 hours
    refreshThrottleMs: 60000,          // Refresh max once per minute
    storageKey: '_sessionMeta'
  };

  /**
   * Save session metadata with expiry timestamp
   * Call this after successful login
   * @param {Object} userData - User data to store
   */
  function saveSession(userData) {
    const sessionMeta = {
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_CONFIG.expiryMs,
      lastActivity: Date.now(),
      userId: userData?.id || userData?.auth_user_id || null
    };
    localStorage.setItem(SESSION_CONFIG.storageKey, JSON.stringify(sessionMeta));
    console.log('[Auth] Session saved, expires at:', new Date(sessionMeta.expiresAt).toLocaleString());
  }

  /**
   * Check if current session is valid
   * @returns {boolean}
   */
  function isSessionValid() {
    const metaStr = localStorage.getItem(SESSION_CONFIG.storageKey);
    if (!metaStr) return false;
    
    try {
      const meta = JSON.parse(metaStr);
      const now = Date.now();
      
      if (!meta.expiresAt || now > meta.expiresAt) {
        console.warn('[Auth] Session expired');
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all session data
   */
  function clearSession() {
    localStorage.removeItem(SESSION_CONFIG.storageKey);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('avatarUrl');
    console.log('[Auth] Session cleared');
  }

  /**
   * Check session validity on page load
   * Returns true if session is valid, false if expired/missing
   * @returns {boolean}
   */
  function checkSessionOnLoad() {
    // Skip check if no session exists (user not logged in)
    const metaStr = localStorage.getItem(SESSION_CONFIG.storageKey);
    if (!metaStr) {
      // No session = not logged in, which is fine
      return true;
    }
    
    if (!isSessionValid()) {
      clearSession();
      // Show notification if available
      if (typeof showNotification === 'function') {
        showNotification('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.', 'warning');
      }
      return false;
    }
    
    return true;
  }

  /**
   * Refresh session expiry on user activity
   * Call this on significant user interactions
   */
  let lastRefresh = 0;
  function refreshSessionOnActivity() {
    const now = Date.now();
    
    // Throttle to max once per minute
    if (now - lastRefresh < SESSION_CONFIG.refreshThrottleMs) return;
    
    const metaStr = localStorage.getItem(SESSION_CONFIG.storageKey);
    if (!metaStr) return;
    
    try {
      const meta = JSON.parse(metaStr);
      meta.expiresAt = now + SESSION_CONFIG.expiryMs;
      meta.lastActivity = now;
      localStorage.setItem(SESSION_CONFIG.storageKey, JSON.stringify(meta));
      lastRefresh = now;
    } catch {
      // Ignore errors
    }
  }

  // ========================================
  // AUTO ACTIVITY TRACKING
  // ========================================
  
  // Refresh session on user clicks (throttled)
  document.addEventListener('click', function() {
    refreshSessionOnActivity();
  });

  // Periodic session check (every 5 minutes)
  setInterval(function() {
    const metaStr = localStorage.getItem(SESSION_CONFIG.storageKey);
    if (metaStr && !isSessionValid()) {
      clearSession();
      if (typeof showNotification === 'function') {
        showNotification('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.', 'warning');
      }
      // Reload page to show login
      location.reload();
    }
  }, 5 * 60 * 1000);

  // ========================================
  // EXPOSE TO GLOBAL SCOPE
  // ========================================
  
  window.AuthHardening = {
    // Rate Limiting
    checkLoginRateLimit,
    recordLoginAttempt,
    
    // Session Management
    saveSession,
    isSessionValid,
    clearSession,
    checkSessionOnLoad,
    refreshSessionOnActivity,
    
    // Config (for debugging)
    RATE_LIMIT_CONFIG,
    SESSION_CONFIG
  };

  // Also expose individual functions for backward compatibility
  window.checkLoginRateLimit = checkLoginRateLimit;
  window.recordLoginAttempt = recordLoginAttempt;
  window.saveSession = saveSession;
  window.isSessionValid = isSessionValid;
  window.clearSession = clearSession;
  window.checkSessionOnLoad = checkSessionOnLoad;

  console.log('[Auth Hardening] Loaded - Rate Limiting + Session Expiry active');

})(window);
