import utils from "./utils";
import config from "./config";
import Profile from "./profile";
import WebPush from "./webpush";
import { fyno_constants } from "./constants";

export var requestTime;
const FynoInstance = {};

class Fyno {
    async init(wsid, token, integration, env = "live") {
        requestTime = new Date();
        fyno_constants.wsid = wsid;
        fyno_constants.api = token;
        fyno_constants.integration = integration;
        config.api_env = env;
        const profile_config = await utils.get_config("fyno:distinct_id");
        if (utils.is_empty(profile_config)) {
            FynoInstance.identified = false;
            this.profile = await new Profile(FynoInstance, utils.uuidv5());
        }
        this.web_push = new WebPush(FynoInstance);
    }

    async identify(distinct_id, name = "") {
        const current_profile = await utils.get_config("fyno:distinct_id");
        if (current_profile !== distinct_id) {
            FynoInstance.identified = true;
            this.profile = await new Profile(FynoInstance, distinct_id, name);
        } else {
            //Do Nothing
        }
    }

    async reset() {
        this.profile.reset();
        FynoInstance.identified = false;
        this.profile = await new Profile(FynoInstance, utils.uuidv5());
    }

    async register_push(vapid) {
        await this.web_push.register_push(vapid);
        return this.profile.webpush;
    }
}

export default new Fyno();
