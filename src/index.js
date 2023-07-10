import utils from "./utils";
import config from "./config";
import Profile from "./profile";
import WebPush from "./webpush";
import { fyno_constants } from "./constants";

export var requestTime;
const FynoInstance = {};

class Fyno {
    async init(wsid, api_key, env = "live") {
        requestTime = new Date();
        fyno_constants.wsid = wsid;
        fyno_constants.api = api_key;
        config.api_env = env;
        const profile_config = await utils.get_config("fyno_user_profile");
        if (
            utils.is_empty(fyno_constants.distinct_id) &&
            utils.is_empty(profile_config)
        ) {
            FynoInstance.identified = false;
            this.profile = await new Profile(FynoInstance, utils.uuidv5());
        }
        this.web_push = await new WebPush(FynoInstance);
    }

    identify(distinct_id, name = "") {
        if (fyno_constants.old_distinct_id !== distinct_id) {
            FynoInstance.identified = true;
            this.profile = new Profile(FynoInstance, distinct_id, name);
        } else {
            //Do Nothing
        }
    }

    async reset() {
        this.profile.reset();
        FynoInstance.identified = false;
        this.profile = await new Profile(FynoInstance, utils.uuidv5());
    }
}

export default new Fyno();
