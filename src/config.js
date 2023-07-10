const package_data = require("../package.json");

const config = {
    sdk_version: package_data.version,
    service_worker_file: "serviceworker.js",
    sw_delay: 10000,
    api_url: "https://api.dev.fyno.io",
    api_version: "v1",
    api_env: "live",
    event_endpoint: "/event",
    user_endpoint: "/profiles",
};

export default config;
