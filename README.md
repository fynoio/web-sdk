# Fyno SDK Documentation for Techies

The Fyno SDK is designed for technical users who are responsible for integrating and working with the Fyno web push service. This documentation provides a detailed overview of the SDK's functionalities and how to use them.

## Installation

To use the Fyno SDK in your project, follow these steps:

```bash
npm install fyno-sdk
```

## Initialization
Initialize the Fyno SDK with workspace id, signature, integration id. Before that create a HMAC signature for your integration by following the below process and it's suggested store it in you .env to use it in the website

### Creating Signature
```javascript
const Crypto = require("crypto");
const signature = createHmac("sha256", wsid + access_token)
                    .update(owner_mail)
                    .digest("hex");
```
### Initialize SDK
```javascript
const fyno = require('fyno-sdk');

// Initialize Fyno SDK
fyno.init(wsid, token, integration, env);
```

* `wsid`: Workspace ID
* `token`: API Signature
* `integration`: Integration type
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
