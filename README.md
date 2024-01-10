# Fyno WebPush SDK Documentation

The Fyno SDK is designed for technical users who are responsible for integrating and working with the Fyno web push service. This documentation provides a detailed overview of the SDK's functionalities and how to use them.

## Installation

To use the Fyno SDK in your project, follow these steps:

```bash
npm install @fyno/websdk
```

## Initialization
Initialize the Fyno SDK with workspace id, signature, integration id. Before that create a HMAC signature for your integration by following the below process and it's suggested store it in you .env to use it in the website

### Creating Signature
This will be a one time generation and you can store the value in you environment variables(`.env`) or in secret manager if any.

```javascript
const Crypto = require("crypto");
const signature = createHmac("sha256", wsid + access_token)
                    .update(owner_mail)
                    .digest("hex");
```
### Initialize SDK
```javascript
const fyno = require('@fyno/websdk');

// Initialize Fyno SDK
fyno.init(wsid, signature, integration, env);
```

* `wsid`: Workspace ID
* `signature`: HMAC Created in previous step
* `integration`: Integration ID
* `env` (optional): Environment (default is "live")

## Push Notification Registration
Register push notifications with a VAPID key provided in you Fyno integration

```javascript
const vapidKey = "your_vapid_key";
const webpushDetails = await fyno.register_push(vapidKey);
```
* `vapidKey`: VAPID key for push notifications


## User Identification
Identify a user with a distinct ID:
```javascript
fyno.identify(distinct_id, name);
```

* `distinct_id`: Distinct ID of the user
* `name` (optional): Name of the user

## User Profile Reset
Reset the user profile when your user logs out.

```javascript
fyno.reset();
```

## Registering Service Worker
To register service worker and handle incoming messages from server, create a `serviceworker.js` file in your public folder and use following code snippet in created service worker.

```javascript
importScripts("https://cdn.jsdelivr.net/npm/@fyno/websdk@1.1.8/sw/serviceworker.min.js")
```