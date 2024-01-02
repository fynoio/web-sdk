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

    subscribe_push = async (reg) => {
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
}

export default WebPush;
