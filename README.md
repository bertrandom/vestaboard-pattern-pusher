# vestaboard-pattern-pusher

Each day, the Vestaboard iOS app shows 3 suggested messages under "Top Picks". One of the messages is always a colorful pattern.

![IMG_1976](https://user-images.githubusercontent.com/57770/132603297-e3a0a540-6110-49a9-8f4b-31399c904bee.jpg)

I usually like that pattern, so I'll press the button to **Send** it to my Vestaboard, but I'd like to automate this.

Luckily, the Vestaboard iOS app does not use certificate pinning, so by placing [mitmproxy](https://mitmproxy.org/) between it and the Internet, we can examine the traffic to it.

After you login to the Vestaboard app, it'll go through an OAuth flow, which will call `https://vestaboard.auth0.com/oauth/token`, exchanging the code for an access token and a refresh token. The access token lasts 1 day. The refresh token can be used to get a new access token.

If you kill the Vestaboard app and start it up, it'll make several calls to `https://platform.vestaboard.com/graphql`. One of these calls will get information about the viewer, which includes a person ID. Another call will fetch a list of suggestions, passing in the person ID.

Then we simply take the pattern and push it to the Vestaboard using the API.

## Installation

Copy `config/default.json5` to `config/local.json5`.

Go to https://web.vestaboard.com/ and click on Developers.

Create a new Installable, then click on Create API Credential. Put the key and secret in `config/local.json5`.

Call:

```
curl -H "X-Vestaboard-Api-Key: YOUR_API_KEY" -H "X-Vestaboard-Api-Secret: YOUR_API_SECRET" https://platform.vestaboard.com/subscriptions
```

and note the subscription ID. Put this in `config/local.json5`.

Configure your iPhone to use mitmproxy and launch the Vestaboard app. Logout and login again.

Look for a request to `https://vestaboard.auth0.com/oauth/token` and examine the response - it should contain the refresh token. Put this in `config/local.json5`.

Run `npm install`.

## Usage

Calling 

```
node push
```

will push the pattern to your Vestaboard. You can add this to a cronjob, for example, to run it at 8 AM everyday.
