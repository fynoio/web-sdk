# Fyno WebPush SDK Documentation

The Fyno SDK is designed for technical users who are responsible for integrating and working with the Fyno web push service. This documentation provides a detailed overview of the SDK's functionalities and how to use them.

## Installation

To use the Fyno SDK in your project, follow these steps:

```bash
npm install @fyno/websdk
```

## Initialization
Initialize the Fyno SDK with workspace id, integration id. Before that create a HMAC signature for your integration by following the below process and it's suggested store it in you .env to use it in the website

```javascript
const fyno = require('@fyno/websdk');

// Initialize Fyno SDK
fyno.init(wsid, integration, env);
```

* `wsid`: Workspace ID
* `integration`: Integration ID
* `env` (optional): Environment (default is "live")

## Customise Notification Pop-up
Fyno SDK displays a custom popup for asking users for notification permissions before proceeding with push subscription registration which can be customizable as per your applications UI.

```javascript
fyno.setCustomPopupConfig(options)
```

#### Parameters
options (Object): An object containing customizable properties for the popup. Default values will be used if not provided.
backgroundColorOverlay (String): Background color of the overlay. Default: 'rgba(0, 0, 0, 0.5)'.

`popupBackgroundColor` (String): Background color of the popup. Default: 'white'.

`popupPadding` (String): Padding of the popup. Default: '20px'.

`popupMarginTop` (String): Margin top of the popup. Default: '50px'.

`popupBorderRadius` (String): Border radius of the popup. Default: '8px'.

`popupTextAlign` (String): Text alignment inside the popup. Default: 'center'.

`popupBoxShadow` (String): Box shadow of the popup. Default: '0 4px 8px rgba(0, 0, 0, 0.1)'.

`popupMaxWidth` (String): Maximum width of the popup. Default: '500px'.

`popupWidth` (String): Width of the popup. Default: '400px'.

`popupzIndex` (String): z-Index of the popup. Default: 999.

`closeIconText` (String): Text content of the close icon. Default: '✖'.

`closeIconFontSize` (String): Font size of the close icon. Default: '20px'.

`messageText` (String): Message displayed in the popup. Default: Dynamic text based on the origin of the website.

`buttonColor` (String): Color of the buttons in the popup. Default: '#3F51B5'

`allowButtonText` (String): Text content of the "Allow" button. Default: 'Allow'.

`denyButtonText` (String): Text content of the "Deny" button. Default: 'Deny'.

`remindLaterText` (String): Text content for the "Remind me later" option. Default: 'Remind me later'.
```


## Push Notification Registration
Register push notifications with a VAPID key provided in you Fyno integration. 

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
importScripts("https://cdn.jsdelivr.net/npm/@fyno/websdk@1.1.17/sw/serviceworker.min.js")
```