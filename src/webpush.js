import utils from "./utils";
import config from "./config";
import Profile from "./profile";
import { requestTime } from "./index";
import { fyno_constants } from "./constants";
var timer;
class WebPush {
    constructor(instance) {
        utils.get_config("fyno:distinct_id").then((res) => {
            this.profile = new Profile(instance, res, "", false);
        });
    }

    notification_permission() {
        return Notification.permission;
    }

    is_push_available = () => {
        return !!("serviceWorker" in navigator && "PushManager" in window);
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
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
      }

    async showCustomPopup() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'flex-start';
            overlay.style.justifyContent = 'center';
    
            const popup = document.createElement('div');
            popup.style.backgroundColor = 'white';
            popup.style.padding = '20px';
            popup.style.marginTop = '50px';
            popup.style.borderRadius = '8px';
            popup.style.textAlign = 'center';
            popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            popup.style.maxWidth = '500px';
            popup.style.width = '400px';
            popup.style.position = 'relative';
    
            const closeIcon = document.createElement('div');
            closeIcon.textContent = '✖';
            closeIcon.style.position = 'absolute';
            closeIcon.style.top = '10px';
            closeIcon.style.right = '10px';
            closeIcon.style.fontSize = '20px';
            closeIcon.style.cursor = 'pointer';
            closeIcon.addEventListener('click', () => {
                overlay.remove();
                resolve('close');
            });
    
            const message = document.createElement('p');
            message.textContent = window.origin.split("://")[1].split("/")[0] + ' Wants to send push notificatios. Do you want to allow notifications?';
    
            const allowButton = document.createElement('button');
            allowButton.textContent = 'Allow';
            allowButton.style.backgroundColor = '#3F51B5';
            allowButton.style.color = 'white';
            allowButton.style.border = 'none';
            allowButton.style.padding = '10px 20px';
            allowButton.style.marginRight = '10px';
            allowButton.style.cursor = 'pointer';
            allowButton.addEventListener('click', () => {
                overlay.remove();
                resolve('allow');
            });
    
            const denyButton = document.createElement('button');
            denyButton.textContent = 'Deny';
            denyButton.style.backgroundColor = '#3F51B5';
            denyButton.style.color = 'white';
            denyButton.style.border = 'none';
            denyButton.style.padding = '10px 20px';
            denyButton.style.cursor = 'pointer';
            denyButton.addEventListener('click', () => {
                localStorage.setItem("push_status", "denied")
                this.deleteCookie("remind_later");
                overlay.remove();
                resolve('deny');
            });
    
            const remindLaterText = document.createElement('div');
            remindLaterText.textContent = 'Remind me later';
            remindLaterText.style.marginTop = '10px';
            remindLaterText.style.color = '#888';
            remindLaterText.addEventListener('click', () => {
                this.setCookie("remind_later", true, 12)
                overlay.remove();
                resolve('close');
            });
    
            popup.appendChild(closeIcon);
            popup.appendChild(message);
            popup.appendChild(allowButton);
            popup.appendChild(denyButton);
            popup.appendChild(remindLaterText);
    
            overlay.appendChild(popup);
            document.body.appendChild(overlay);
        });
    }
    

    register_serviceworker = () => {
        return navigator.serviceWorker
            .register(config.service_worker_file, {
                scope: config.sw_scope
            })
            .then((registration) => {
                this.subscribe_push(registration);
            })
            .catch((err) => {
                console.error("Fyno: Error in serviceworker registration", err);
            });
    };

    get_subscription = () => {
        return navigator.serviceWorker.ready
            .then((registration) => {
                return registration.pushManager.getSubscription();
            })
            .then(async (subscription) => {
                if (!subscription) {
                    return;
                }
                return subscription;
            });
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
            const permission = Notification.permission
        
            // If permission is granted, update channel
            if (permission === 'granted') {
                console.log('Notification Permission granted');
                const registration = await navigator.serviceWorker.ready;                
                const existingSubscription = await registration.pushManager.getSubscription();                
                const sub = await localStorage.getItem("fyno_push_subscription");                
                // If there is no existing subscription or stored subscription,
                // or if the stored subscription is different, subscribe again
                if (JSON.stringify(sub) !== existingSubscription) {
                    const applicationServerKey = utils.urlB64ToUint8Array(
                        config.vapid_key
                    );
                    const newSubscription = await registration.pushManager.subscribe({ applicationServerKey, userVisibleOnly: true });
                    this.profile.set_webpush(newSubscription);
                } else {
                    console.log('Valid existing or stored subscription found.');
                }
            } else if (permission === 'denied') {
                console.log('Notification Permission denied.');
            } else {
            // Permission is 'default' (may be later), show custom popup    
            // If the user allows, proceed with service worker registration
            if(await localStorage.getItem("push_status") === "denied")
                return
            if(this.getCookie("remind_later")) {
                return
            }
            const now = new Date();
            const delay = now - requestTime;
            const has_delay = delay >= config.sw_delay;
            if (has_delay) {
                await this.register_serviceworker();
            } else {
                clearTimeout(timer);
                timer = setTimeout(async () => {
                    await this.register_serviceworker();
                }, config.sw_delay - delay);
            }
        }
    }

    subscribe_push = async (reg) => {
        const userResponse = await this.showCustomPopup()
        if (userResponse === 'allow') {
            const permission = await this.ask_permissions();
            if (permission === "granted") {
                const subscription = await this.get_subscription();
                if (!subscription) {
                    if (!config.vapid_key) {
                        console.log("Fyno: No vapid provided to register push");
                        return;
                    }
                    const applicationServerKey = utils.urlB64ToUint8Array(
                        config.vapid_key
                    );
                    const subscription = await reg.pushManager.subscribe({
                        applicationServerKey,
                        userVisibleOnly: true,
                    });
                    await this.profile.set_webpush(subscription);
                }
            }
        } else {
            console.log('User denied custom popup. Do nothing.');
        }
    };

    update_subscription() {
        navigator?.serviceWorker?.ready
            .then((registration) => {
                return registration.pushManager.getSubscription();
            })
            .then((subscription) => {
                if (!subscription) {
                    return;
                }
                this.profile.set_webpush(subscription);
            });
    }

    register_push = async (vapid) => {
        config.vapid_key = vapid;
        if (this.is_push_available()) {
            await this.subscribe_with_delay();
        } else {
            console.log("Fyno: Browser not supported for web push");
        }
    };

    get_current_subscription = async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        return registration.pushManager
            .getSubscription()
            .then(async (subscription) => {
                if (!subscription) return;
                return subscription;
            });
    };

    is_subscribed = async () => {
        const subscription = await this.get_subscription_without_wait();
        return !!subscription;
    };

    allow_push = async () => {
        await localStorage.setItem("push_status", "allowed");
        this.deleteCookie("remind_later")
        await this.subscribe_push()
    }
}

export default WebPush;
