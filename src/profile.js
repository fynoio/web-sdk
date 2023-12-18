import utils from "./utils";
import { fyno_constants } from "./constants";

class Profile {
    constructor(instance, distinct_id, name = "", update = true) {
        this.instance = instance;
        this.distinct_id = distinct_id;
        if (update)
            this.identify(
                this.distinct_id,
                utils.is_empty(name) ? distinct_id : name
            );
    }

    update_channel = (channel_obj) => {
        utils.trigger(
            "update_channel",
            {
                channel: channel_obj,
            },
            "PATCH"
        );
    };

    identify = async (distinct_id, name) => {
        if (utils.is_empty(distinct_id)) return;
        const old_user_id = await utils.get_config("fyno:distinct_id");
        utils.set_config("fyno:last_distinct_id", old_user_id);
        utils.set_config("fyno:distinct_id", distinct_id);
        if (!this.instance.identified) {
            await utils.trigger("create_profile", {
                distinct_id,
                name,
            });
        } else {
            if (old_user_id != distinct_id) {
                if (utils.is_empty(old_user_id)) {
                    await utils.trigger(
                        "update_profile",
                        {
                            distinct_id,
                            name,
                        },
                        "PUT"
                    );
                } else {
                    await utils.trigger("merge_profile", {}, "PATCH");
                    await utils.trigger(
                        "update_profile",
                        { distinct_id, name },
                        "PUT"
                    );
                }
            }
            this.instance.identified = true;
        }
        // const { timezone_id, timezone_name } = await utils.get_timezone();
    };

    get_identity = () => {
        return this.distinct_id;
    };

    set_sms = (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error("invalid mobile received");
            return;
        }
        this.sms = mobile_number;
        this.update_channel({
            sms: mobile_number,
        });
    };

    get_sms = () => {
        return this.sms;
    };

    set_voice = (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error("invalid mobile received");
            return;
        }
        this.voice = mobile_number;
        this.update_channel({
            voice: mobile_number,
        });
    };

    get_voice = () => {
        return this.voice;
    };

    set_whatsapp = (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error("invalid mobile received");
            return;
        }
        this.whatsapp = mobile_number;
        this.update_channel({
            whatsapp: mobile_number,
        });
    };

    get_whatsapp = () => {
        return this.whatsapp;
    };

    set_email = (email) => {
        if (!email || utils.is_empty(email) || !utils.regex.email.test(email)) {
            console.error("invalid email received");
            return;
        }
        this.email = email;
        this.update_channel({
            email,
        });
    };

    get_email = () => {
        return this.email;
    };

    set_webpush = (subscription) => {
        if (!subscription || utils.is_empty(subscription)) {
            console.error("invalid push subscription");
        }
        this.webpush = subscription;
        this.update_channel({
            webpush: [
                {
                    token: subscription,
                    integration_id: fyno_constants.integration,
                    status: Notification.permission === "granted" ? 1 : 0,
                },
            ],
        });
    };

    get_webpush = () => {
        return this.webpush;
    };

    reset = async () => {
        await utils.trigger(
            "delete_channel",
            {
                channel: {
                    webpush: [this.webpush],
                },
            },
            "PATCH"
        );
    };
}

export default Profile;
