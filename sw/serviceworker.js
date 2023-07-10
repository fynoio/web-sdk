import { fyno_constants, fyno_message_status } from "../src/constants";

self.addEventListener("push", function (e) {
    var notification = e.data.json();
    fetch(notification.fyno_callback, fyno_message_status.received);
    e.waitUntil(
        self.registration.showNotification(
            notification.title || "",
            notification
        )
    );
});

self.addEventListener("notificationclose", function (e) {
    var notification = e.notification;
    fetch(notification.fyno_callback, fyno_message_status.dismissed);
});

self.addEventListener("notificationclick", function (e) {
    e.notification.close();
    var notification = e.notification;
    var actions = notification.data.actions;
    var redirect_url = "/";
    if (actions) {
        if (e.action && actions[e.action]) {
            fetch(notification.fyno_callback, fyno_message_status.action);
            redirect_url = actions[e.action];
        } else if (actions["default"]) {
            redirect_url = actions["default"];
        }
    } else {
        fetch(notification.fyno_callback, fyno_message_status.clicked);
        redirect_url = "/";
    }
    clients.openWindow(redirect_url);
});
