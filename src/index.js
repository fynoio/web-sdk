import utils from "./utils";
import {openDB} from 'idb';
import config from "./config";
import Profile from "./profile";
import WebPush from "./webpush";
import { fyno_constants } from "./constants";
import customPopupConfig from "./customPopupConfig";
import { detectIncognito } from "detectincognitojs";
export var requestTime;
const FynoInstance = {};

class Fyno {
    async init(wsid, integration, env = "live", options = {}) {
        return new Promise(async (resolve, reject) => {
            try {
                const { isPrivate } = await detectIncognito();
                if(isPrivate) {
                    console.error("Not supported in private browsing modes");
                    reject();
                    return;
                }
                await this.createStoreInDB();
                requestTime = new Date();
                fyno_constants.wsid = wsid;
                fyno_constants.integration = integration;
                config.api_env = env;
                if(options.service_worker && options.service_worker!==""){
                    config.service_worker_file = options.service_worker
                }

                if(options.sw_scope && options.sw_scope !== ""){
                    config.sw_scope = options.sw_scope
                }

                if(options.api_url && options.api_url !== ""){
                    config.api_url = options.api_url
                }

                if(options.sw_delay && options.sw_delay!==""){
                    config.sw_delay = options.sw_delay
                }
    
                const profile_config = await utils.get_config(FynoInstance.indexDb, "fyno:distinct_id");
                if (utils.is_empty(profile_config)) {
                    const fyno_uuid = await utils.uuidv5();
                    FynoInstance.identified = false;
                    this.profile = new Profile(FynoInstance, fyno_uuid);
                    let res = await this.profile.identify(fyno_uuid);
                } else {
                    this.profile = new Profile(FynoInstance, profile_config);
                }

                this.web_push = await new WebPush(FynoInstance);
                FynoInstance.initialized = true;
                resolve(this.profile.distinct_id);
            } catch (error) {
                console.error(error);
                reject();
            }
        });
    }

    async createStoreInDB() {
        try {            
            FynoInstance.indexDb = await openDB('fyno-websdk', 1, {
                upgrade(db) {
                  if (!db.objectStoreNames.contains('config')) {
                    db.createObjectStore('config');
                  }
                },
              });
        } catch (error) {
            console.error(error);
            throw error;
        }
      }
      

    async identify(distinct_id, name = "") {
        if(!FynoInstance.initialized){
            console.log("Fyno instance not initialized, make sure you have initialized before calling register_push");
            return;
        }
        const current_profile = await utils.get_config(FynoInstance.indexDb, "fyno:distinct_id");
        if (current_profile !== distinct_id) {
            FynoInstance.identified = true;
            this.profile = await new Profile(FynoInstance, distinct_id);
            await this.profile.identify(distinct_id, name)
        } else {
            this.profile = await new Profile(FynoInstance, distinct_id);
        }
        return this.profile.distinct_id
    }

    async reset() {
        if( !FynoInstance.initialized ) return;
        let token = await this.web_push.get_current_subscription();
        await this.profile.reset(token);
        FynoInstance.identified = false;
        let fyno_uuid = await utils.uuidv5()
        this.profile = new Profile(FynoInstance, fyno_uuid);
        await this.profile.identify(fyno_uuid)
        await this.profile.set_webpush(await this.web_push.get_subscription())
    }

    setCustomPopupConfig(options) {
        customPopupConfig.options = {...customPopupConfig.options, ...options}
    }

    async register_push(vapid) {
        if(!FynoInstance.initialized){
            console.log("Fyno instance not initialized, make sure you have initialized before calling register_push");
            return;
        } 
        await this.web_push.register_push(vapid);
        return await this.web_push.get_current_subscription();
    }

    async add_channel(channel, token) {
        if(!FynoInstance.initialized) return;
        switch(channel){
            case 'sms':
                await this.profile.set_sms(token);
                break;
            case 'voice':
                await this.profile.set_voice(token);
                break;
            case 'whatsapp':
                await this.profile.set_whatsapp(token);
                break;
            case 'inapp':
                await this.profile.set_inapp(token);
                break;
            case 'email':
                    await this.profile.set_email(token);
                    break;
            default:
                console.error('Invalid channel');
                break;
        }
    }
 }

export default new Fyno();