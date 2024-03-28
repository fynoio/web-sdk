const package_data = require("../package.json");

const config = {
    sdk_version: package_data.version,
    service_worker_file: "/serviceworker.js",
    sw_delay: 5000,
    api_url: "https://api.fyno.io",
    api_version: "v2",
    api_env: "live",
    event_endpoint: "/event",
    user_endpoint: "/track/profile",
    sw_scope: "/"
};

export default config;