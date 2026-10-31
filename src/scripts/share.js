// „Udostępnij”: systemowe menu udostępniania (telefon), a gdy go brak – kopiowanie linku do schowka.
export function initShare() {
  document.querySelectorAll('[data-share]').forEach((btn) => {
    const status = btn.parentElement.querySelector('[role="status"]');
    btn.addEventListener('click', async () => {
      const data = { title: btn.dataset.shareTitle, url: btn.dataset.shareUrl };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(data.url);
        if (status) status.textContent = btn.dataset.shareDone || 'Link skopiowany';
      } catch (e) {
        if (e?.name !== 'AbortError' && status) status.textContent = `${btn.dataset.shareFallback || 'Skopiuj link:'} ${data.url}`;
      }
      if (status) setTimeout(() => { status.textContent = ''; }, 4000);
    });
  });
}
