import config from "./config";
import { fyno_constants } from "./constants";

const _get_endpoint = async (instance, route) => {
    let url = `${config.api_url}/${config.api_version}/${fyno_constants.wsid}/track/${config.api_env}/`;
    switch (route) {
        case "trigger_event":
            url += `event`;
            break;
        case "create_profile":
            url += `profile`;
            break;
        case "merge_profile":
            url += `profile/${await get_config(instance.indexDb,
                "fyno:last_distinct_id"
            )}/merge/${await get_config(instance.indexDb,"fyno:distinct_id")}`;
            break;
        case "update_profile":
            url += `profile/${await get_config(instance.indexDb,"fyno:distinct_id")}`;
            break;
        case "update_channel":
            url += `profile/${await get_config(instance.indexDb,"fyno:distinct_id")}/channel`;
            break;
        case "delete_channel":
            url += `profile/${await get_config(instance.indexDb,
                "fyno:distinct_id"
            )}/channel/delete`;
            break;
        case "delete_profile":
            url += `profile/delete`;
            break;
        default:
            url += `event`;
    }
    return url;
};

const uuidv5 = async () => {
    var dt = new Date().getTime();
    const uuid = await "xxxxxxxx-xxxx-5xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (dt + Math.random() * 16) % 16 | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
    return uuid
};

const is_empty = (obj) => {
    if (Array.isArray(obj)) {
        return obj.length === 0;
    } else if (obj instanceof Object) {
        return Object.keys(obj.toJSON()).length === 0;
    } else {
        return [null, undefined, ""].includes(obj);
    }
};

const trigger = async (instance, route, body, method = "POST") => {
    const endpoint = await _get_endpoint(instance, route);
    const req_body = JSON.stringify(body);
    const verify_token = await get_config(instance.indexDb,'verify_token');
    const integration = fyno_constants.integration;
    try {
        const trigger_res = await fetch(endpoint, {
            method: method,
            body: req_body,
            headers: {
                "Content-Type": "application/json",
                verify_token,
                integration,
            },
        });
        return trigger_res
    } catch (error) {
        console.error(error);
    }
};

const regex = {
    email: /^\S+@\S+\.\S+$/,
};

const urlB64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

const get_timezone = async () => {
    const list = await (
        await fetch("https://app.fyno.io/api/app/users/timezone")
    ).json();
    return list.filter((obj) => {
        obj.timezone_name.includes(
            Intl.DateTimeFormat().resolvedOptions().timeZone
        );
    });
};
function _set_cookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function _get_cookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

const set_config = async (db, key, value) => {
    const tx = db.transaction('config', 'readwrite');
    const store = tx.objectStore('config');
    await store.put({ field: value }, key);
    await tx.complete;
};

const get_config = async (db, key) => {
    const tx = db.transaction('config', 'readonly');
    const store = tx.objectStore('config');
    const value = await store.get(key);
    await tx.complete;
    return value ? value.field : undefined;
};

export default {
    urlB64ToUint8Array,
    is_empty,
    regex,
    trigger,
    uuidv5,
    get_timezone,
    set_config,
    get_config,
};