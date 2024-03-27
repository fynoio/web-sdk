import utils from './utils';
import { fyno_constants } from './constants';
import config from './config';
import WebPush from './webpush';

class Profile {
    constructor(instance, distinct_id) {
        this.instance = instance;
        this.distinct_id = distinct_id;
        this.webpush = new WebPush(this.instance);
    }

    update_channel = async (channel_obj) => {
        return await utils.trigger(
            this.instance,
            'update_channel',
            {
                channel: channel_obj
            },
            'PATCH'
        );
    };

    identify = async (distinct_id, name) => {
        if (!name) name = undefined;
        if (utils.is_empty(distinct_id)) return;
        let res;
        const current_sub = this.webpush.get_current_subscription();
        const old_user_id = await utils.get_config(
            this.instance.indexDb,
            'fyno:distinct_id'
        );
        await utils.set_config(
            this.instance.indexDb,
            'fyno:last_distinct_id',
            old_user_id
        );
        await utils.set_config(
            this.instance.indexDb,
            'fyno:distinct_id',
            distinct_id
        );
        if (!this.instance.identified) {
            await this.set_token(distinct_id);
            res = await utils.trigger(this.instance, 'create_profile', {
                distinct_id,
                name
            });
        } else {
            if (old_user_id != distinct_id) {
                if (utils.is_empty(old_user_id) && !utils.is_empty(name)) {
                    res = await utils.trigger(
                        this.instance,
                        'update_profile',
                        {
                            distinct_id,
                            name,
                            channel: current_sub
                                ? {
                                      webpush: [
                                          {
                                              token: current_sub,
                                              integration_id:
                                                  fyno_constants.integration,
                                              status:
                                                  Notification.permission ===
                                                  'granted'
                                                      ? 1
                                                      : 0
                                          }
                                      ]
                                  }
                                : undefined
                        },
                        'PUT'
                    );
                } else {
                    res = await utils.trigger(
                        this.instance,
                        'merge_profile',
                        {},
                        'PATCH'
                    );
                    await this.set_token(distinct_id);
                    if (!utils.is_empty(name)) {
                        await utils.trigger(
                            this.instance,
                            'update_profile',
                            { distinct_id, name },
                            'PUT'
                        );
                    }
                }
            }
            this.instance.identified = true;
            await utils.remove_config(
                this.instance.indexDb,
                'fyno_push_subscription'
            );
            await utils.remove_config(
                this.instance.indexDb,
                'fyno_push_permission'
            );
            return res;
        }
    };

    get_identity = () => {
        return this.distinct_id;
    };

    set_sms = async (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error('invalid mobile received');
            return;
        }
        this.sms = mobile_number;
        await this.update_channel({
            sms: mobile_number
        });
    };

    get_sms = () => {
        return this.sms;
    };

    set_voice = async (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error('invalid mobile received');
            return;
        }
        this.voice = mobile_number;
        await this.update_channel({
            voice: mobile_number
        });
    };

    get_voice = () => {
        return this.voice;
    };

    set_whatsapp = async (mobile_number) => {
        if (!mobile_number || utils.is_empty(mobile_number)) {
            console.error('invalid mobile received');
            return;
        }
        this.whatsapp = mobile_number;
        await this.update_channel({
            whatsapp: mobile_number
        });
    };

    get_whatsapp = () => {
        return this.whatsapp;
    };

    set_email = async (email) => {
        if (!email || utils.is_empty(email) || !utils.regex.email.test(email)) {
            console.error('invalid email received');
            return;
        }
        this.email = email;
        await this.update_channel({
            email
        });
    };

    get_email = () => {
        return this.email;
    };

    set_inapp = async (inapp_token) => {
        if (!inapp_token || utils.is_empty(inapp_token)) {
            console.error('invalid token received');
            return;
        }
        this.inapp_token = inapp_token;
        await this.update_channel({
            inapp: {
                token: this.inapp_token,
                status: 1
            }
        });
    };

    get_inapp = () => {
        return this.inapp_token;
    };

    set_webpush = async (subscription) => {
        if (!subscription || utils.is_empty(subscription)) {
            console.error('invalid push subscription');
        }

        if (
            (await utils.get_config(
                this.instance.indexDb,
                'fyno_push_subscription'
            )) === JSON.stringify(subscription)
        ) {
            if (
                (await utils.get_config(
                    this.instance.indexDb,
                    'fyno_push_permission'
                )) === Notification.permission
            )
                return;
        }
        this.webpush_subscription = subscription;
        await this.update_channel({
            webpush: [
                {
                    token: subscription,
                    integration_id: fyno_constants.integration,
                    status: Notification.permission === 'granted' ? 1 : 0
                }
            ]
        });
        await utils.set_config(
            this.instance.indexDb,
            'fyno_push_subscription',
            JSON.stringify(subscription)
        );
        await utils.set_config(
            this.instance.indexDb,
            'fyno_push_permission',
            Notification.permission
        );
    };

    get_webpush = () => {
        return this.webpush.get_current_subscription();
    };

    set_token = async (distinct_id) => {
        try {
            const { token } = await (
                await fetch(
                    `${config.api_url}/${config.api_version}/${fyno_constants.wsid}/${distinct_id}/token`
                )
            ).json();
            await utils.set_config(
                this.instance.indexDb,
                'verify_token',
                token
            );
        } catch (error) {
            console.log(error);
        }
    };

    get_token = async () => {
        return await utils.get_config(this.instance.indexDb, 'verify_token');
    };

    reset = async (token) => {
        if (token) {
            await utils.trigger(
                this.instance,
                'delete_channel',
                {
                    webpush: [token]
                },
                'POST'
            );
        } else {
            console.log('No webpush subscription available');
        }
    };
}

export default Profile;
