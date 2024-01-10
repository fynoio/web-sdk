import utils from "./utils";
import { fyno_constants } from "./constants";

class Profile {
    constructor(instance, distinct_id) {
        this.instance = instance;
        this.distinct_id = distinct_id;
    }

    update_channel = async (channel_obj) => {
        return await utils.trigger(
            "update_channel",
            {
                channel: channel_obj,
            },
            "PATCH"
        );
    };

    identify = async (distinct_id, name) => {
        if (utils.is_empty(distinct_id)) return;
        let res;
        const old_user_id = await utils.get_config("fyno:distinct_id");
        utils.set_config("fyno:last_distinct_id", old_user_id);
        utils.set_config("fyno:distinct_id", distinct_id);
        if (!this.instance.identified) {
            res = await utils.trigger("create_profile", {
                distinct_id,
                name,
            });
        } else {
            if (old_user_id != distinct_id) {
                if (utils.is_empty(old_user_id)) {
                    res = await utils.trigger(
                        "update_profile",
                        {
                            distinct_id,
                            name,
                        },
                        "PUT"
                    );
                } else {
                    res = await utils.trigger("merge_profile", {}, "PATCH");
                    await utils.trigger(
                        "update_profile",
                        { distinct_id, name },
                        "PUT"
                    );
                }
            }
            this.instance.identified = true;
            return res
        }
        // const { timezone_id, timezone_name } = await utils.get_timezone();
    };

    get_identity = () => {
        return this.distinct_id;
    };

    set_sms = async (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error("invalid mobile received");
            return;
        }
        this.sms = mobile_number;
        await this.update_channel({
            sms: mobile_number,
        });
    };

    get_sms = () => {
        return this.sms;
    };

    set_voice = async (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error("invalid mobile received");
            return;
        }
        this.voice = mobile_number;
        await this.update_channel({
            voice: mobile_number,
        });
    };

    get_voice = () => {
        return this.voice;
    };

    set_whatsapp = async (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error("invalid mobile received");
            return;
        }
        this.whatsapp = mobile_number;
        await this.update_channel({
            whatsapp: mobile_number,
        });
    };

    get_whatsapp = () => {
        return this.whatsapp;
    };

    set_email = async (email) => {
        if (!email || utils.is_empty(email) || !utils.regex.email.test(email)) {
            console.error("invalid email received");
            return;
        }
        this.email = email;
        await this.update_channel({
            email,
        });
    };

    get_email = () => {
        return this.email;
    };

    set_webpush = async (subscription) => {
        if (!subscription || utils.is_empty(subscription)) {
            console.error("invalid push subscription");
        }
        this.webpush = subscription;
        await this.update_channel({
            webpush: [
                {
                    token: subscription,
                    integration_id: fyno_constants.integration,
                    status: Notification.permission === "granted" ? 1 : 0,
                },
            ],
        });
        await localStorage.setItem("fyno_push_subscription",JSON.stringify(subscription));
    };

    get_webpush = () => {
        return WebPush.get_subscription();
    };

    reset = async (token) => {
        if(token){
            await utils.trigger(
                "delete_channel",
                {
                    webpush: [token],
                },
                "POST"
            );
        } else {
            console.log("No webpush subscription available");
        }
    };
}

export default Profile;
