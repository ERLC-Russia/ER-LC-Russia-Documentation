/**
 * ER:LC Russia Documentation - Mintlify Session & Account Menu Script
 * Synchronizes user session with the backend API and renders the account menu in the navbar.
 * Exact 1:1 match with Frontend AccountMenu.tsx
 */

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

  // Тексты локализации
  function getTranslations() {
    const isEn =
      (document.documentElement.lang &&
        document.documentElement.lang.toLowerCase().startsWith('en')) ||
      window.location.pathname.startsWith('/en');

    if (isEn) {
      return {
        linkRoblox: 'Link Roblox',
        settings: 'Settings',
        dashboard: 'Dashboard',
        logout: 'Log out',
        login: 'Login',
        menuAria: 'Account menu',
      };
    }

    return {
      linkRoblox: 'Привязать Roblox',
      settings: 'Настройки',
      dashboard: 'Дашборд',
      logout: 'Выйти',
      login: 'Вход',
      menuAria: 'Меню пользователя',
    };
  }

  // Получение URL аватарки в точности как в AccountMenu.tsx
  function getAvatarUrl(user) {
    if (!user) return 'https://cdn.erlcrussia.com/images/Moscow-RolePlay-Icon-Website.png';
    if (user.image) return user.image;
    if (user.discordAvatar && user.discordId) {
      return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordAvatar}.png?size=256`;
    }
    if (user.robloxAvatar) return user.robloxAvatar;
    return 'https://cdn.erlcrussia.com/images/Moscow-RolePlay-Icon-Website.png';
  }

  // Безопасное экранирование строк
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // SVG иконки в точности из AccountMenu.tsx (Lucide-react size=18 + Roblox icon)
  const icons = {
    roblox: `<svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style="flex-shrink:0;">
      <path d="M3.38116 0L0 12.6188L12.6188 16L16 3.38116L3.38116 0ZM9.291 10.2363L5.76484 9.291L6.71013 5.76484L10.2377 6.71013L9.291 10.2363Z"/>
    </svg>`,
    settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
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

  // Проверка прав администратора / дашборда через API бэкенда по текущей сессии
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

  // Запрос сессии с бэкенда
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

  // Выход из аккаунта
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
      // Очищаем куки на клиенте
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

  // Отрисовка UI
  function renderAccountUI() {
    const ctaButton = document.getElementById('topbar-cta-button');
    if (!ctaButton) return;

    const t = getTranslations();

    // Если пользователь не авторизован -> стандартная кнопка входа
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

    // Пользователь авторизован -> отключаем дефолтные ссылки контейнера
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
    const displayName = currentUser.name || currentUser.username || 'Avatar';
    const currentCallback = encodeURIComponent(window.location.href);

    let dropdownHtml = '';

    if (isOpen) {
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

      dropdownHtml = `
        <div class="account-dropdown">
          ${itemsHtml}
        </div>
      `;
    }

    container.innerHTML = `
      <button class="account-avatar-button" type="button" aria-label="${escapeHtml(t.menuAria)}">
        <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(displayName)}" class="account-avatar" />
      </button>
      ${dropdownHtml}
    `;

    // Привязка событий
    const avatarBtn = container.querySelector('.account-avatar-button');
    if (avatarBtn) {
      avatarBtn.onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        isOpen = !isOpen;
        renderAccountUI();
      };
    }

    if (isOpen) {
      const robloxBtn = container.querySelector('#erlc-docs-roblox-btn');
      if (robloxBtn) {
        robloxBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          window.location.href = `${FRONTEND_URL}/login/roblox?callbackUrl=${currentCallback}`;
        };
      }

      const settingsBtn = container.querySelector('#erlc-docs-settings-btn');
      if (settingsBtn) {
        settingsBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          window.open(`${FRONTEND_URL}/my/account`, '_blank');
        };
      }

      const dashboardBtn = container.querySelector('#erlc-docs-dashboard-btn');
      if (dashboardBtn) {
        dashboardBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          window.open(`${FRONTEND_URL}/dashboard/${firstAllowedPage}`, '_blank');
        };
      }

      const logoutBtn = container.querySelector('#erlc-docs-logout-btn');
      if (logoutBtn) {
        logoutBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          isOpen = false;
          handleSignOut(e);
        };
      }
    }
  }

  // Закрытие меню при mousedown вне контейнера (в точности как в React useEffect AccountMenu.tsx)
  document.addEventListener('mousedown', function (event) {
    if (!isOpen) return;
    const container = document.querySelector('.account-menu-container');
    if (container && !container.contains(event.target)) {
      isOpen = false;
      renderAccountUI();
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen) {
      isOpen = false;
      renderAccountUI();
    }
  });

  // Инициализация и отслеживание SPA навигации в Mintlify
  function init() {
    fetchSession();

    // Наблюдатель за изменениями DOM для поддержки динамической навигации Mintlify
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
