var config = require('config');
var rp = require('request-promise-native');

function getGraphRequest(token, body) {

    return {
        uri: 'https://api.vestaboard.com/graphql',
        headers: {
            'x-vestaboard-token': token,
            'user-agent': 'Vestaboard/804 CFNetwork/3860.400.51 Darwin/25.3.0',
        },
        json: true,
        body: body
    };

}

async function getPattern(token) {

    return rp.post(getGraphRequest(token, {
        "operationName": "ListInspiration",
        "variables": {
            "input": {
                "limit": 12,
                "cursor": null,
                "boardStyle": "black"
            }
        },
        "query": "query ListInspiration($input: ListInspirationInputV2!) {\n  listInspirationV2(input: $input) {\n    items {\n      id\n      pick {\n        id\n        date\n        created\n        attribution\n        likeCount\n        isLikedByMe\n        mediumIcon: icon(size: Medium)\n        message {\n          id\n          characters\n          isFavorited\n          __typename\n        }\n        __typename\n      }\n      feedItem {\n        id\n        created\n        attribution\n        likeCount\n        isLikedByMe\n        personId\n        mediumIcon: icon(size: Medium)\n        message {\n          id\n          characters\n          isFavorited\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    nextCursor\n    __typename\n  }\n}"
    })).then((body) => {

        var selected = 0;

        for (var i = 0; i < body.data.listInspirationV2.items.length; i++) {

            var msg_char_array = body.data.listInspirationV2.items[i].pick.message.characters;

            // This is a pick for the Vestaboard Note because it only has 3 lines, skip it...
            if (msg_char_array.length <= 3) {
                continue;
            }

            // If it contains text (A-Z, 0-9), then it's also invalid...
            var valid = true;

            for (const row of msg_char_array) {
                for (const char of row) {
                    if (char >= 1 && char <= 36) {
                        valid = false;
                    }
                }
            }

            // But let's return the first valid one we find
            if (valid) {
                selected = i;
                break;
            }

        }

        return body.data.listInspirationV2.items[selected].pick.message.characters;

    });

}

async function getAccessToken(refreshToken) {

    return rp.post({
        uri: 'https://vestaboard.auth0.com/oauth/token',
        form: {
            grant_type: 'refresh_token',
            client_id: config.client_id,
            refresh_token: refreshToken,
        },
        json: true,
    }).then((body) => {
        return body.access_token;
    });

}

async function pushToVestaboard(apiKey, apiSecret, subscriptionId, pattern) {

    return rp.post({
        headers: {
            'X-Vestaboard-Api-Key': apiKey,
            'X-Vestaboard-Api-Secret': apiSecret,
        },
        uri: 'https://platform.vestaboard.com/subscriptions/' + subscriptionId + '/message',
        body: JSON.stringify({
            characters: pattern,
        }),
    }).then((body) => {
        console.log(body);
    }).catch((e) => {
        console.error(e);
    });

}

(async function() {

    var accessToken = await getAccessToken(config.refresh_token);
    var pattern = await getPattern(accessToken);
    await pushToVestaboard(config.api_key, config.api_secret, config.subscription_id, pattern);

}());