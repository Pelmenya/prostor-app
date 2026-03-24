self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data?.json() ?? {};
    } catch {
        data = { title: 'PROSTOR' };
    }

    event.waitUntil(
        self.registration.showNotification(data.title ?? 'PROSTOR', {
            body: data.body,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
            data: { url: data.url },
        }),
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const raw = event.notification.data?.url ?? '/';
    const safeUrl = typeof raw === 'string' && raw.startsWith('/') ? raw : '/';

    event.waitUntil(
        clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                return clients.openWindow(safeUrl);
            }),
    );
});
