// FocusGuard - monitors tab switching while avoiding false positives on mobile screen lock

const isMobileDevice = typeof window !== 'undefined' && (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
);

let activeWakeLock = null;

export async function requestScreenWakeLock() {
  if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
    try {
      activeWakeLock = await navigator.wakeLock.request('screen');
      activeWakeLock.addEventListener('release', () => {
        activeWakeLock = null;
      });
    } catch (err) {
      // Screen wake lock request can fail if low battery or background tab
    }
  }
}

export function releaseScreenWakeLock() {
  if (activeWakeLock) {
    try {
      activeWakeLock.release();
    } catch (e) {}
    activeWakeLock = null;
  }
}

/**
 * Setup anti-tab switching listener
 * @param {Object} options
 * @param {Function} options.onTabSwitch - Called when user genuinely switches tabs/apps
 * @param {boolean} options.isSimulator - If true, skips monitoring
 * @returns {Function} cleanup function
 */
export function setupTabSwitchGuard({ onTabSwitch, isSimulator = false }) {
  if (isSimulator || typeof window === 'undefined') {
    return () => {};
  }

  requestScreenWakeLock();

  let blurTimestamp = 0;
  let hiddenTimestamp = 0;
  let hasFocusLostWhileVisible = false;

  const handleBlur = () => {
    blurTimestamp = Date.now();
    // If blur happens while document is still visible, user tapped outside browser / switched apps / pulled notification shade
    if (!document.hidden) {
      hasFocusLostWhileVisible = true;
    }
  };

  const handleFocus = () => {
    hasFocusLostWhileVisible = false;
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      hiddenTimestamp = Date.now();
      
      // On desktop: any hide is an app/tab switch
      if (!isMobileDevice) {
        onTabSwitch?.({ reason: 'desktop_tab_switch', timestamp: Date.now() });
        return;
      }

      // On mobile:
      // If user blurred BEFORE hiding (e.g. app switcher gesture, notification shade, tapped another tab):
      // that is a genuine tab switch!
      if (hasFocusLostWhileVisible) {
        onTabSwitch?.({ reason: 'mobile_app_switch', timestamp: Date.now() });
      }
    } else {
      // Page became visible again
      if (isMobileDevice) {
        // If document was hidden without prior blur while visible, and screen was turned off (power button lock):
        // do NOT count as a tab switch!
        if (hasFocusLostWhileVisible) {
          hasFocusLostWhileVisible = false;
        } else {
          // Re-request wake lock if screen was turned back on
          requestScreenWakeLock();
        }
      }
    }
  };

  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    releaseScreenWakeLock();
  };
}
