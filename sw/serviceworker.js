const fyno_message_status = {
    received: "DELIVERED",
    clicked: "CLICKED",
    action: "ACTION",
    dismissed: "DISMISSED",
};

function getBrowserInfo() {
    const userAgent = navigator.userAgent.toLowerCase();

    const browsers = {
        chrome: /chrome/.test(userAgent),
        firefox: /firefox/.test(userAgent),
        safari: /safari/.test(userAgent),
        opera: /opera/.test(userAgent),
        ie: /msie|trident/.test(userAgent),
        edge: /edge/.test(userAgent),
        yandex: /yabrowser/.test(userAgent),
        ucBrowser: /ucbrowser/.test(userAgent),
        cmBrowser: /acheetahi/.test(userAgent),
    };

    const operatingSystems = {
        windows: /windows/.test(userAgent),
        mac: /macintosh|mac os x/.test(userAgent),
        linux: /linux/.test(userAgent),
        android: /android/.test(userAgent),
        ios: /iphone|ipad|ipod/.test(userAgent),
        windowsPhone: /windows phone/.test(userAgent),
    };

    const isIos = operatingSystems.ios;
    const isAndroid = operatingSystems.android;
    const isMacOs = operatingSystems.mac;
    const isWindows = operatingSystems.windows;

    const deviceTypes = {
        desktop: !/mobile|tablet/.test(userAgent),
        mobile: /mobile/.test(userAgent),
        tablet: /tablet/.test(userAgent),
    };

    const version = {
        browser: getVersion(
            userAgent,
            /(?:chrome|firefox|safari|opera|msie|trident|edge|yabrowser|ucbrowser|acheetahi)\/([\d\.]+)/i
        ),
        os: getVersion(
            userAgent,
            /(?:windows|macintosh|android|iphone|ipad|ipod|windows phone) ([\d_\.]+)/i
        ),
    };

    function getVersion(userAgent, regex) {
        const match = userAgent.match(regex);
        return match ? match[1] : undefined;
    }

    return {
        browser:
            Object.keys(browsers).find((browser) => browsers[browser]) ||
            "unknown",
        os:
            Object.keys(operatingSystems).find((os) => operatingSystems[os]) ||
            "unknown",
        isIos,
        isAndroid,
        isMacOs,
        isWindows,
        deviceType:
            Object.keys(deviceTypes).find((type) => deviceTypes[type]) ||
            "unknown",
        version: version,
        language: navigator.language || "",
        userAgent: navigator.userAgent,
    };
}

self.addEventListener("push", async function (e) {
    var notification = e.data.json();
    const details = getBrowserInfo();

    const pushObj = {
        body: notification.body,
        icon: details.isIos && details.isMacOs ? notification.image : notification.icon,
        badge: notification.badge,
        data: {
            additional_data: notification.data.additional_data,
            image: notification.data.image,
            callback_url: notification.data.callback_url,
            clicked: false
        },
        vibrate: notification.vibrate || [200, 100, 200],
        tag: notification.tag,
        image: notification.data.image,
        actions: notification.actions,
        requireInteraction: notification.interaction || false,
    };
    await fetch(pushObj.data.callback_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            status: fyno_message_status.received,
            eventType: "Delivery",
            timestamp: new Date().getTime.toString(),
            message: details,
        }),
    });
    e.waitUntil(
        self.registration.showNotification(notification.title || "", pushObj)
    );
});

self.addEventListener("notificationclose", async function (e) {
    var notification = e.notification;
    if (!notification.data.clicked) {
        fetch(notification.data.callback_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: fyno_message_status.dismissed,
                eventType: "Delivery",
                timestamp: new Date().getTime,
                message: getBrowserInfo(),
            }),
        });
    }
});

self.addEventListener("notificationclick", async function (e) {
    var notification = e.notification;
    var actions = notification.data.actions;
    var redirect_url = "/";
    if (actions) {
        fetch(notification.callback_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: fyno_message_status.action,
                eventType: "Delivery",
                timestamp: new Date().getTime,
                message: getBrowserInfo(),
            }),
        });
        if (e.action && actions[e.action]) {
            redirect_url = actions[e.action];
        } else if (actions["default"]) {
            redirect_url = actions["default"];
        }
    } else {
        fetch(notification.data.callback_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: fyno_message_status.clicked,
                eventType: "Delivery",
                timestamp: new Date().getTime,
                message: getBrowserInfo(),
            }),
        });
        redirect_url = "/";
    }
    e.notification.data.clicked = true;
    notification.close()
    clients.openWindow(redirect_url);
});

self.addEventListener('pushsubscriptionchange', (event) => {
    // Send a message to the client when the push subscription changes
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'pushSubscriptionChange',
                newSubscription: event.newSubscription
            });
        });
    });
});