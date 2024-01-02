import utils from "./utils";
import config from "./config";
import Profile from "./profile";
import WebPush from "./webpush";
import { fyno_constants } from "./constants";

export var requestTime;
const FynoInstance = {};

class Fyno {
    // async init(wsid, token, integration, env = "live") {
    //     requestTime = new Date();
    //     fyno_constants.wsid = wsid;
    //     fyno_constants.api = token;
    //     fyno_constants.integration = integration;
    //     config.api_env = env;
    //     const profile_config = await utils.get_config("fyno:distinct_id");
    //     if (utils.is_empty(profile_config)) {
    //         const fyno_uuid = await utils.uuidv5()
    //         FynoInstance.identified = false;
    //         this.profile = new Profile(FynoInstance, fyno_uuid);
    //         let res = await this.profile.identify(fyno_uuid)
    //         console.log(res);
    //     } else {
    //         this.profile = new Profile(FynoInstance, profile_config)
    //     }
    //     this.web_push = new WebPush(FynoInstance);
    // }
    async init(wsid, token, integration, env = "live", options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                requestTime = new Date();
                fyno_constants.wsid = wsid;
                fyno_constants.api = token;
                fyno_constants.integration = integration;
                config.api_env = env;
    
                const profile_config = await utils.get_config("fyno:distinct_id");
                if (utils.is_empty(profile_config)) {
                    const fyno_uuid = await utils.uuidv5();
                    FynoInstance.identified = false;
                    this.profile = new Profile(FynoInstance, fyno_uuid);
                    let res = await this.profile.identify(fyno_uuid);
                } else {
                    this.profile = new Profile(FynoInstance, profile_config);
                }
                if(options.service_worker && options.service_worker!==""){
                    config.service_worker_file = options.service_worker
                }

                if(options.sw_scope && options.sw_scope !== ""){
                    config.sw_scope = options.sw_scope
                }

                if(options.sw_delay && options.sw_delay!==""){
                    config.sw_delay = options.sw_delay
                }

                this.web_push = new WebPush(FynoInstance);
                
                resolve(this.profile.distinct_id);
            } catch (error) {
                reject(error);
            }
        });
    }

    async identify(distinct_id, name = "") {
        const current_profile = await utils.get_config("fyno:distinct_id");
        if (current_profile !== distinct_id) {
            FynoInstance.identified = true;
            this.profile = await new Profile(FynoInstance, distinct_id);
            this.profile.identify(distinct_id, name)
        } else {
            this.profile = await new Profile(FynoInstance, distinct_id);
        }
        return this.profile.distinct_id
    }

    async reset() {
        await this.profile.reset();
        FynoInstance.identified = false;
        let fyno_uuid = await utils.uuidv5()
        this.profile = new Profile(FynoInstance, fyno_uuid);
        await this.profile.identify(fyno_uuid)
        await this.profile.set_webpush(await this.web_push.get_subscription())
    }

    async register_push(vapid) {
        await this.web_push.register_push(vapid);
        return this.profile?.webpush;
    }
}

export default new Fyno();