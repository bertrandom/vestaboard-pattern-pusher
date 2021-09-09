var config = require('config');
var rp = require('request-promise-native');

function getGraphRequest(token, body) {

    return {
        uri: 'https://platform.vestaboard.com/graphql',
        headers: {
            'x-vestaboard-token': token,
            'apollographql-client-version': '1.10-161',
            'user-agent': 'Vestaboard/161 CFNetwork/1240.0.4 Darwin/20.6.0',
            'x-apollo-operation-type': 'query',
            'apollographql-client-name': 'com.vestaboard.Vestaboard-apollo-ios',
            'x-apollo-operation-name': 'Viewer',
        },
        json: true,
        body: body
    };

}

async function getPersonId(token) {

    return rp.post(getGraphRequest(token, {
        "operationName": "Viewer",
        "query": "query Viewer($page: Int!, $perPage: Int!) {\n  viewer {\n    __typename\n    id\n    account {\n      __typename\n      emailAddress\n      person {\n        __typename\n        avatar\n        firstName\n        lastName\n        id\n        tenants {\n          __typename\n          id\n          boards {\n            __typename\n            id\n            title\n            history(page: $page, perPage: $perPage) {\n              __typename\n              id\n              message {\n                __typename\n                created\n                text\n                id\n                authorFormatted\n              }\n            }\n            devices {\n              __typename\n              id\n            }\n          }\n          ... on PersonTenant {\n            id\n            members {\n              __typename\n              id\n              created\n              isCurrentMember\n              invitationStatus\n              person {\n                __typename\n                id\n                firstName\n                lastName\n                account {\n                  __typename\n                  emailAddress\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}",
        "variables": {
            "page": 0,
            "perPage": 1
        }
    })).then((body) => {

        var personId = body.data.viewer.account.person.id;
        return personId;

    });

}

async function getPattern(token, personId) {

    return rp.post(getGraphRequest(token, {
        "operationName": "Automation",
        "query": "query Automation($limit: Int!, $personId: String!) {\n  recommendations(limit: $limit) {\n    __typename\n    automation {\n      __typename\n      message {\n        __typename\n        created\n        id\n        isFavorite(person: $personId)\n        formatted\n        text\n        authorFormatted\n      }\n    }\n  }\n}",
        "variables": {
            "limit": 10,
            "personId": personId,
        }
    })).then((body) => {

        return body.data.recommendations[1].automation.message.formatted;

    });

}

async function getAccessToken(refreshToken) {

    return rp.post({
        uri: 'https://vestaboard.auth0.com/oauth/token',
        form: {
            grant_type: 'refresh_token',
            client_id: 'uIMhzzLyu9GJtQTf5VIU7QTBNdNSuVvM',
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

    var personId = await getPersonId(accessToken);
    var pattern = await getPattern(accessToken, personId);

    await pushToVestaboard(config.api_key, config.api_secret, config.subscription_id, pattern);

}());