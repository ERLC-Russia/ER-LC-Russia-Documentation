(function () {
  'use strict';

  if (window.__ERLC_DOCS_SESSION_RUNNING__) return;
  window.__ERLC_DOCS_SESSION_RUNNING__ = true;

  const API_BASE_URL = 'https://api.erlcrussia.com';
  const FRONTEND_URL = 'https://erlcrussia.com';

  let currentUser = null;
  let isOpen = false;
  let isAdmin = false;
  let firstAllowedPage = 'subscriptions';

  function getTranslations() {
    const path = (window.location.pathname || '').toLowerCase();
    const docLang = (document.documentElement.lang || '').toLowerCase();

    let lang = 'ru';
    if (path.startsWith('/en/') || path === '/en' || docLang.startsWith('en')) {
      lang = 'en';
    } else if (path.startsWith('/uk/') || path === '/uk' || docLang.startsWith('uk')) {
      lang = 'uk';
    } else if (path.startsWith('/es/') || path === '/es' || docLang.startsWith('es')) {
      lang = 'es';
    } else if (path.startsWith('/it/') || path === '/it' || docLang.startsWith('it')) {
      lang = 'it';
    }

    const dict = {
      en: {
        linkRoblox: 'Link Roblox',
        settings: 'Settings',
        notifications: 'Notifications',
        dashboard: 'Dashboard',
        logout: 'Log out',
        login: 'Login',
        menuAria: 'Account menu',
      },
      uk: {
        linkRoblox: 'Прив’язати Roblox',
        settings: 'Налаштування',
        notifications: 'Сповіщення',
        dashboard: 'Дашборд',
        logout: 'Вийти',
        login: 'Увійти',
        menuAria: 'Меню користувача',
      },
      es: {
        linkRoblox: 'Vincular Roblox',
        settings: 'Ajustes',
        notifications: 'Notificaciones',
        dashboard: 'Panel',
        logout: 'Cerrar sesión',
        login: 'Iniciar sesión',
        menuAria: 'Menú de cuenta',
      },
      it: {
        linkRoblox: 'Collega Roblox',
        settings: 'Impostazioni',
        notifications: 'Notifiche',
        dashboard: 'Dashboard',
        logout: 'Disconnettiti',
        login: 'Accedi',
        menuAria: 'Menu account',
      },
      ru: {
        linkRoblox: 'Привязать Roblox',
        settings: 'Настройки',
        notifications: 'Уведомления',
        dashboard: 'Дашборд',
        logout: 'Выйти',
        login: 'Войти',
        menuAria: 'Меню пользователя',
      },
    };

    return dict[lang] || dict.ru;
  }

  function getAvatarUrl(user) {
    if (!user) return 'https://cdn.erlcrussia.com/images/Moscow-RolePlay-Icon-Website.png';
    if (user.image) return user.image;
    if (user.discordAvatar && user.discordId) {
      return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=256`;
    }
    if (user.robloxAvatar) return user.robloxAvatar;
    return 'https://cdn.erlcrussia.com/images/Moscow-RolePlay-Icon-Website.png';
  }

  function getAvatarDecorationUrl(user) {
    if (!user) return null;
    return user.discordAvatarDecoration || null;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const icons = {
    roblox: `<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style="flex-shrink:0;">
      <path d="M3.38116 0L0 12.6188L12.6188 16L16 3.38116L3.38116 0ZM9.291 10.2363L5.76484 9.291L6.71013 5.76484L10.2377 6.71013L9.291 10.2363Z"/>
    </svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`,
    bell: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>`,
    dashboard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
      <rect width="7" height="9" x="3" y="3" rx="1"/>
      <rect width="7" height="5" x="14" y="3" rx="1"/>
      <rect width="7" height="9" x="14" y="12" rx="1"/>
      <rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>`,
    logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" x2="9" y1="12" y2="12"/>
    </svg>`,
  };

  async function checkDashboardAccess() {
    if (!currentUser) {
      isAdmin = false;
      return;
    }

    try {
      const res = await fetch(`${FRONTEND_URL}/api/dashboard/access/my-permissions`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const ALL_PAGES = ['subscriptions', 'redirects', 'users', 'orders', 'plans', 'funpay', 'access'];
        const pages = Array.isArray(data.allowedPages) ? data.allowedPages.filter(p => ALL_PAGES.includes(p)) : [];
        if (data.isOwner) {
          isAdmin = true;
          firstAllowedPage = 'subscriptions';
        } else if (pages.length > 0) {
          isAdmin = true;
          firstAllowedPage = pages[0];
        } else {
          isAdmin = false;
        }
      } else {
        isAdmin = false;
      }
    } catch (err) {
      isAdmin = false;
    } finally {
      renderAccountUI();
    }
  }

  async function fetchSession() {
    try {
      const res = await fetch(`${API_BASE_URL}/v2/auth/session`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) {
        const sessionData = await res.json();
        if (sessionData && sessionData.user) {
          currentUser = sessionData.user;
          checkDashboardAccess();
        } else {
          currentUser = null;
          isAdmin = false;
        }
      } else {
        currentUser = null;
        isAdmin = false;
      }
    } catch (err) {
      console.warn('[ERLC Docs Session] Не удалось проверить сессию:', err);
      currentUser = null;
      isAdmin = false;
    } finally {
      renderAccountUI();
    }
  }

  async function handleSignOut(e) {
    if (e) e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/v2/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('[ERLC Docs Session] Ошибка логаута:', err);
    } finally {
      const expired = '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `erlc_auth${expired}`;
      document.cookie = `erlc_auth${expired} domain=.erlcrussia.com;`;
      document.cookie = `erlc_auth${expired} domain=erlcrussia.com;`;

      currentUser = null;
      isOpen = false;
      isAdmin = false;
      renderAccountUI();
    }
  }

  function renderAccountUI() {
    const ctaButton = document.getElementById('topbar-cta-button');
    if (!ctaButton) return;

    const t = getTranslations();

    if (!currentUser) {
      ctaButton.classList.remove('is-authenticated');
      if (ctaButton.tagName === 'A') {
        ctaButton.href = `${FRONTEND_URL}/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
        ctaButton.onclick = null;
      }
      const existingMenu = ctaButton.querySelector('.account-menu-container');
      if (existingMenu) {
        existingMenu.remove();
      }
      const link = ctaButton.querySelector('a');
      if (link) {
        link.style.display = '';
        link.href = `${FRONTEND_URL}/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
        link.onclick = null;
      }
      return;
    }

    ctaButton.classList.add('is-authenticated');
    if (ctaButton.tagName === 'A') {
      ctaButton.removeAttribute('href');
      ctaButton.onclick = function (e) {
        e.preventDefault();
      };
    }
    const innerLinks = ctaButton.querySelectorAll('a');
    innerLinks.forEach(function (l) {
      if (!l.closest('.account-dropdown')) {
        l.removeAttribute('href');
        l.style.display = 'none';
        l.onclick = function (e) {
          e.preventDefault();
        };
      }
    });

    let container = ctaButton.querySelector('.account-menu-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'account-menu-container';
      ctaButton.appendChild(container);
    }

    const avatarUrl = getAvatarUrl(currentUser);
    const decorationUrl = getAvatarDecorationUrl(currentUser);
    const displayName = currentUser.name || currentUser.username || 'Avatar';
    const currentCallback = encodeURIComponent(window.location.href);

    let avatarBtn = container.querySelector('.account-avatar-button');
    if (!avatarBtn) {
      avatarBtn = document.createElement('button');
      avatarBtn.className = 'account-avatar-button';
      avatarBtn.type = 'button';
      avatarBtn.setAttribute('aria-label', escapeHtml(t.menuAria));
      let avatarHtml = `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}" class="account-avatar" />`;
      if (decorationUrl) {
        avatarHtml += `<img src="${escapeHtml(decorationUrl)}" alt="" aria-hidden="true" class="account-avatar-decoration" />`;
      }
      avatarBtn.innerHTML = avatarHtml;
      avatarBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        isOpen = !isOpen;
        renderAccountUI();
      };
      container.appendChild(avatarBtn);
    } else {
      const img = avatarBtn.querySelector('.account-avatar');
      if (img && img.src !== avatarUrl) {
        img.src = avatarUrl;
      }
      let decoImg = avatarBtn.querySelector('.account-avatar-decoration');
      if (decorationUrl) {
        if (!decoImg) {
          decoImg = document.createElement('img');
          decoImg.className = 'account-avatar-decoration';
          decoImg.alt = '';
          decoImg.setAttribute('aria-hidden', 'true');
          avatarBtn.appendChild(decoImg);
        }
        if (decoImg.src !== decorationUrl) {
          decoImg.src = decorationUrl;
        }
      } else if (decoImg) {
        decoImg.remove();
      }
    }

    let dropdown = container.querySelector('.account-dropdown');

    if (isOpen) {
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'account-dropdown';
        container.appendChild(dropdown);
      }

      let itemsHtml = '';

      if (!currentUser.robloxId) {
        itemsHtml += `
          <button class="dropdown-link-roblox" type="button" id="erlc-docs-roblox-btn">
            ${icons.roblox}
            <span>${escapeHtml(t.linkRoblox)}</span>
          </button>
        `;
      }

      itemsHtml += `
        <button class="dropdown-settings-btn" type="button" id="erlc-docs-settings-btn">
          ${icons.settings}
          <span>${escapeHtml(t.settings)}</span>
        </button>
        <button class="dropdown-settings-btn" type="button" id="erlc-docs-notifications-btn">
          ${icons.bell}
          <span>${escapeHtml(t.notifications)}</span>
        </button>
      `;

      if (isAdmin) {
        itemsHtml += `
          <button class="dropdown-dashboard-btn" type="button" id="erlc-docs-dashboard-btn">
            ${icons.dashboard}
            <span>${escapeHtml(t.dashboard)}</span>
          </button>
        `;
      }

      itemsHtml += `
        <button class="dropdown-logout-btn" type="button" id="erlc-docs-logout-btn">
          ${icons.logout}
          <span>${escapeHtml(t.logout)}</span>
        </button>
      `;

      dropdown.innerHTML = itemsHtml;

      const robloxBtn = dropdown.querySelector('#erlc-docs-roblox-btn');
      if (robloxBtn) {
        robloxBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          window.location.href = `${FRONTEND_URL}/login/roblox?callbackUrl=${currentCallback}`;
        };
      }

      const settingsBtn = dropdown.querySelector('#erlc-docs-settings-btn');
      if (settingsBtn) {
        settingsBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          window.open(`${FRONTEND_URL}/my/account`, '_blank', 'noopener,noreferrer');
        };
      }

      const notifBtn = dropdown.querySelector('#erlc-docs-notifications-btn');
      if (notifBtn) {
        notifBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          window.open(`${FRONTEND_URL}/my/notifications`, '_blank', 'noopener,noreferrer');
        };
      }

      const dashboardBtn = dropdown.querySelector('#erlc-docs-dashboard-btn');
      if (dashboardBtn) {
        dashboardBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          window.open(`${FRONTEND_URL}/dashboard/${firstAllowedPage}`, '_blank', 'noopener,noreferrer');
        };
      }

      const logoutBtn = dropdown.querySelector('#erlc-docs-logout-btn');
      if (logoutBtn) {
        logoutBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          handleSignOut(e);
        };
      }
    } else {
      if (dropdown) {
        dropdown.remove();
      }
    }
  }

  document.addEventListener('mousedown', function (event) {
    if (!isOpen) return;
    const container = document.querySelector('.account-menu-container');
    if (container && !container.contains(event.target)) {
      isOpen = false;
      renderAccountUI();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      renderAccountUI();
    }
  });

  document.addEventListener(
    'pointerdown',
    function (e) {
      const btn =
        e.target && e.target.closest
          ? e.target.closest('#theme-preference-menu-trigger, .theme-preference-menu-trigger')
          : null;
      if (btn) {
        btn.classList.add('is-active-pressed');
        const onUp = function () {
          btn.classList.remove('is-active-pressed');
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onUp);
        };
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      }
    },
    true
  );

  function reorderHeaderElements() {
    try {
      const themeTrigger =
        document.querySelector('#theme-preference-menu-trigger') ||
        document.querySelector('button#theme-preference-menu-trigger') ||
        document.querySelector('[data-component-name="theme-preference-menu"]') ||
        document.querySelector('header .theme-preference-menu-trigger');

      const supportBtn =
        document.querySelector('header a[href*="erlcrussia.com/discord"]') ||
        document.querySelector('header a[href*="discord.gg"]') ||
        document.querySelector('header a[href*="discord"]');

      if (!themeTrigger || !supportBtn) return;

      const themeWrapper = themeTrigger.closest('[data-component-name="theme-preference-menu"]') || themeTrigger.parentElement;
      const supportWrapper = supportBtn.closest('nav') || supportBtn.parentElement;

      if (themeWrapper && supportWrapper && themeWrapper.parentElement === supportWrapper.parentElement) {
        const parent = themeWrapper.parentElement;
        const children = Array.from(parent.children);
        const themeIndex = children.indexOf(themeWrapper);
        const supportIndex = children.indexOf(supportWrapper);
        if (themeIndex > supportIndex) {
          parent.insertBefore(themeWrapper, supportWrapper);
        }
      }
    } catch (e) { }
  }

  function init() {
    fetchSession();
    reorderHeaderElements();

    const observer = new MutationObserver(function () {
      const ctaButton = document.getElementById('topbar-cta-button');
      if (ctaButton) {
        const hasCustomContainer = ctaButton.querySelector('.account-menu-container');
        if (currentUser && !hasCustomContainer) {
          renderAccountUI();
        } else if (!currentUser && ctaButton.classList.contains('is-authenticated')) {
          renderAccountUI();
        }
      }
      reorderHeaderElements();
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

