/* LEOGO ADMIN MOBILE NAVIGATION ONLY
   Isolated fix. Does not modify authentication, orders, sellers,
   customers, providers, transport, products or settlement functions.
*/
(function () {
  function initMobileNavigation() {
    const side = document.getElementById('side');
    const menu = document.querySelector('.mobile-menu');
    if (!side || !menu) return;

    // Remove any stale inline handler and use a direct listener.
    menu.removeAttribute('onclick');
    menu.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      side.classList.toggle('open');
    });

    // Close the drawer after selecting a navigation item.
    side.querySelectorAll('button[data-page]').forEach(function (button) {
      button.addEventListener('click', function () {
        side.classList.remove('open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNavigation);
  } else {
    initMobileNavigation();
  }
})();
