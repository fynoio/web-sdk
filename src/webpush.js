import utils from './utils';
import config from './config';
import Profile from './profile';
import { requestTime } from './index';
import { fyno_constants } from './constants';
import customPopupConfig from './customPopupConfig';
var timer;
class WebPush {
    constructor(instance) {
        this.instance = instance;
        utils.get_config(instance.indexDb, 'fyno:distinct_id').then((res) => {
            this.profile = new Profile(instance, res, '', false);
        });
    }

    notification_permission() {
        return Notification.permission;
    }

    is_push_available = () => {
        return !!('serviceWorker' in navigator && 'PushManager' in window);
    };

    ask_permissions = async () => await Notification.requestPermission();

    deleteCookie(cookieName) {
        const now = new Date();
        const expires = new Date(0).toUTCString();
        document.cookie = `${cookieName}=; expires=${expires}; path=/`;
    }

    setCookie(cookieName, cookieValue, expirationHours) {
        const now = new Date();
        const expirationTime = now.getTime() + expirationHours * 60 * 60 * 1000;
        const expires = new Date(expirationTime).toUTCString();

        document.cookie = `${cookieName}=${cookieValue}; expires=${expires}; path=/`;
    }

    getCookie(cname) {
        let name = cname + '=';
        let ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    }

    async showCustomPopup() {
        if (!this.is_push_available()) {
            console.log('Web push is not available');
            return;
        }
        const {
            backgroundColorOverlay = 'rgba(0, 0, 0, 0.5)',
            popupBackgroundColor = 'white',
            popupPadding = '20px',
            popupMarginTop = '50px',
            popupBorderRadius = '8px',
            popupTextAlign = 'center',
            popupBoxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)',
            popupMaxWidth = '500px',
            popupWidth = '400px',
            popupzIndex = '999',
            closeIconText = '✕',
            closeIconFontSize = '20px',
            messageText = `${
                window.origin.split('://')[1].split('/')[0]
            } wants to send push notifications. Do you want to allow notifications?`,
            buttonColor = '#3F51B5',
            allowButtonText = 'Allow',
            denyButtonText = 'Deny',
            remindLaterText = 'Remind me later'
        } = customPopupConfig.options;
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = backgroundColorOverlay;
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'flex-start';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = popupzIndex;

            const popup = document.createElement('div');
            popup.style.backgroundColor = popupBackgroundColor;
            popup.style.padding = popupPadding;
            popup.style.marginTop = popupMarginTop;
            popup.style.borderRadius = popupBorderRadius;
            popup.style.textAlign = popupTextAlign;
            popup.style.boxShadow = popupBoxShadow;
            popup.style.maxWidth = popupMaxWidth;
            popup.style.width = popupWidth;
            popup.style.position = 'relative';

            const closeIcon = document.createElement('div');
            closeIcon.textContent = closeIconText;
            closeIcon.style.position = 'absolute';
            closeIcon.style.top = '10px';
            closeIcon.style.right = '10px';
            closeIcon.style.fontSize = closeIconFontSize;
            closeIcon.style.cursor = 'pointer';
            closeIcon.addEventListener('click', () => {
                overlay.remove();
                resolve('close');
            });

            const message = document.createElement('p');
            message.textContent = messageText;

            const allowButton = document.createElement('button');
            allowButton.textContent = allowButtonText;
            allowButton.style.backgroundColor = buttonColor;
            allowButton.style.color = 'white';
            allowButton.style.border = 'none';
            allowButton.style.padding = '10px 20px';
            allowButton.style.marginRight = '10px';
            allowButton.style.cursor = 'pointer';
            allowButton.addEventListener('click', async () => {
                await utils.set_config(
                    this.instance.indexDb,
                    'push_status',
                    'allowed'
                );
                overlay.remove();
                resolve('allow');
            });

            const denyButton = document.createElement('button');
            denyButton.textContent = denyButtonText;
            denyButton.style.backgroundColor = buttonColor;
            denyButton.style.color = 'white';
            denyButton.style.border = 'none';
            denyButton.style.padding = '10px 20px';
            denyButton.style.cursor = 'pointer';
            denyButton.addEventListener('click', async () => {
                await utils.set_config(
                    this.instance.indexDb,
                    'push_status',
                    'denied'
                );
                this.deleteCookie('remind_later');
                overlay.remove();
                resolve('deny');
            });

            const remindLaterTextElement = document.createElement('div');
            remindLaterTextElement.textContent = remindLaterText;
            remindLaterTextElement.style.marginTop = '10px';
            remindLaterTextElement.style.color = '#888';
            remindLaterTextElement.addEventListener('click', async () => {
                await utils.set_config(
                    this.instance.indexDb,
                    'push_status',
                    'remind_later'
                );
                this.setCookie('remind_later', true, 12);
                overlay.remove();
                resolve('close');
            });

            popup.appendChild(closeIcon);
            popup.appendChild(message);
            popup.appendChild(allowButton);
            popup.appendChild(denyButton);
            popup.appendChild(remindLaterTextElement);

            overlay.appendChild(popup);
            document.body.appendChild(overlay);
        });
    }

    register_serviceworker = async (push) => {
        try {
            const registration = await navigator.serviceWorker.register(
                config.service_worker_file,
                {
                    scope: config.sw_scope
                }
            );
            if (push && registration) {
                await this.subscribe_push(registration);
            }
            return registration;
        } catch (error) {
            console.log(error.message);
        }
    };

    get_subscription = async () => {
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) registration = await register_serviceworker(false);
        let sub = await registration?.pushManager?.getSubscription();
        if (!sub) {
            return;
        }
        return sub;
    };

    async subscribe_with_delay() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { data } = event;

            if (data.type === 'pushSubscriptionChange') {
                const newSubscription = data.newSubscription;
                // Handle the push subscription change in your application
                this.profile.set_webpush(newSubscription);
            }
        });

        // Check if the user has already granted permission
        const permission = Notification.permission;

        // If permission is granted, update channel
        if (permission === 'granted') {
            console.log('Notification Permission granted');
            const existingSubscription = await this.get_current_subscription();
            const sub = await utils.get_config(
                this.instance.indexDb,
                'fyno_push_subscription'
            );
            // If there is no existing subscription or stored subscription,
            // or if the stored subscription is different, subscribe again
            if (JSON.stringify(sub) !== existingSubscription) {
                this.profile.set_webpush(existingSubscription);
            }
        } else if (permission === 'denied') {
            console.log('Notification Permission denied.');
        } else {
            // Permission is 'default' (may be later), show custom popup
            // If the user allows, proceed with service worker registration
            if (
                (await utils.get_config(
                    this.instance.indexDb,
                    'push_status'
                )) === 'denied'
            )
                return;
            if (this.getCookie('remind_later')) {
                return;
            }
            const now = new Date();
            const delay = now - requestTime;
            const has_delay = delay >= config.sw_delay;
            if (has_delay) {
                await this.register_serviceworker(true);
            } else {
                clearTimeout(timer);
                timer = setTimeout(async () => {
                    await this.register_serviceworker(true);
                }, config.sw_delay - delay);
            }
        }
    }

    subscribe_push = async (reg) => {
        const userResponse = await this.showCustomPopup();
        if (userResponse === 'allow') {
            const permission = await this.ask_permissions();
            if (permission === 'granted') {
                const subscription = await this.get_subscription();
                if (!subscription) {
                    if (!config.vapid_key) {
                        console.log('Fyno: No vapid provided to register push');
                        return;
                    }
                    const applicationServerKey = utils.urlB64ToUint8Array(
                        config.vapid_key
                    );
                    const subscription = await reg.pushManager.subscribe({
                        applicationServerKey,
                        userVisibleOnly: true
                    });
                    await this.profile.set_webpush(subscription);
                }
            }
        } else {
            console.log('User denied custom popup. Do nothing.');
        }
    };

    async update_subscription() {
        let registration = await navigator?.serviceWorker?.getRegistration();
        if (!registration) {
            registration = await this.register_serviceworker(false);
        }

        const sub = await registration?.pushManager?.getSubscription();
        if (!sub) return;
        this.profile.set_webpush(sub);
    }

    register_push = async () => {
        if (this.is_push_available()) {
            await this.subscribe_with_delay();
        } else {
            console.log('Fyno: Browser not supported for web push');
        }
    };

    get_current_subscription = async () => {
        if (!config.vapid_key) return;
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            registration = await this.register_serviceworker(false);
        }
        let sub = await registration?.pushManager?.getSubscription();
        if (!sub) {
            return;
        }
        return sub;
    };

    is_subscribed = async () => {
        const subscription = await this.get_current_subscription();
        return !!subscription;
    };

    allow_push = async () => {
        await utils.set_config(this.instance.indexDb, 'push_status', 'allowed');
        this.deleteCookie('remind_later');
        navigator.serviceWorker
            .getRegistration()
            .then(async (reg) => {
                if (!reg) await this.register_serviceworker();
                await this.subscribe_push(reg);
            })
            .catch((err) => {
                console.log('Fyno: Push registration failed');
            });
    };
}

export default WebPush;
