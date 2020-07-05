/*
 * f1tv-master-link-generator - Script to get authenticated F1TV session media URL from session slug & F1TV credentials
 * Copyright (C) 2020 eXhumer
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const fetch = require("node-fetch");
const UglifyJS = require("uglify-js");

const parseF1TVEnvConsts = (jsText) => {
    for(const node of UglifyJS.parse(jsText).body) {
        if(node.start.value === "fom")
        {
            for(const subexprnode of node.body.expressions) {
                if(subexprnode.operator === "=" && subexprnode.left.property === "envConstant" && subexprnode.right.start.value === "function")
                {
                    for(const exprBody of subexprnode.right.expression.body) {
                        if(typeof exprBody.value === "object")
                        {
                            for(const prop of exprBody.value.properties) {
                                if(prop.key === "ENV_CONST")
                                {
                                    const envConsts = {
                                        apikey: "",
                                        distributionChannel: ""
                                    };

                                    for(const subprop of prop.value.properties) {
                                        switch(subprop.key) {
                                            case "apikey":
                                                envConsts.apikey = subprop.value.value;
                                                break;
                                            case "distributionChannel":
                                                envConsts.distributionChannel = subprop.value.value;
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                    return envConsts;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}

const f1tvEnvConsts = () => {
    return fetch("https://account.formula1.com/scripts/main.min.js")
        .then(resp => resp.text())
        .then(jsText => parseF1TVEnvConsts(jsText));
};

const f1tvGetSessionId = (sessionSlug, authorization) => {
    const options = {
        method: "GET",
        headers: {
            "Authorization": "JWT " + authorization
        }
    };
    return fetch(`https://f1tv-api.formula1.com/agl/1.0/can/en/all_devices/global/session-occurrence/slug/${sessionSlug}/availability`, options)
        .then(resp => resp.json())
        .then(sessionDetails => sessionDetails.objects[0].uid);
};

const f1tvIdenProvider = () => {
    return fetch("https://f1tv-api.formula1.com/agl/1.0/unk/en/all_devices/global/identity-providers/dlbi")
        .then(resp => resp.json())
        .then(idenDetails => idenDetails.objects[0].self);
}

const f1tvAuthenticate = (user, pass) => {
    return f1tvIdenProvider()
        .then(idenUrl => {
            return f1tvLogin(user, pass)
                .then(subscriptionToken => {
                    const authData = {
                        "access_token": subscriptionToken,
                        "identity_provider_url": idenUrl
                    };
                    const dataStr = JSON.stringify(authData);
                    const options = {
                        method: "POST",
                        headers: {
                            "Content-Length": dataStr.length,
                            "Content-Type": "application/json"
                        },
                        body: dataStr
                    };
                    return fetch("https://f1tv-api.formula1.com/agl/1.0/unk/en/all_devices/global/authenticate", options)
                        .then(resp => resp.json())
                        .then(authResp => authResp.token);
                });
        })
};

const f1tvLogin = (user, pass) => {
    return f1tvEnvConsts()
        .then(env => {
            const loginData = {
                "Login": user,
                "Password": pass,
                "DistributionChannel": env.distributionChannel
            };
            const dataStr = JSON.stringify(loginData);
            const options = {
                method: "POST",
                headers: {
                    "Accept": "application/json, text/javascript, */*; q=0.01",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Accept-Language": "en-US,en;q=0.5",
                    "apiKey": env.apikey,
                    "Connection": "keep-alive",
                    "Content-Length": dataStr.length,
                    "Content-Type": "application/json",
                    "Origin": "https://account.formula1.com/",
                    "Referer": "https://account.formula1.com/",
                    "Host": "api.formula1.com",
                    "TE": "Trailers"
                },
                body: dataStr
            };
            return fetch("https://api.formula1.com/v2/account/subscriber/authenticate/by-password", options)
                .then(resp => resp.json())
                .then(userDetails => userDetails.data.subscriptionToken);
        })
};

const f1tvGetSessionChannelUrl = sessionId => {
    return fetch(`https://f1tv-api.formula1.com/agl/1.0/can/en/all_devices/global/session-occurrence/${sessionId}/race`)
        .then(resp => resp.json())
        .then(sessionInfo => sessionInfo.channel_urls[0]);
};

const f1tvGetTokenizedUrl = (channelId, authorization) => {
    const data = JSON.stringify({"channel_url": channelId});
    const options = {
        method: "POST",
        headers: {
            "Authorization": "JWT " + authorization,
            "Content-Length": data.length,
            "Content-Type": "application/json"
        },
        body: data
    };
    return fetch("https://f1tv-api.formula1.com/agl/1.0/can/en/all_devices/global/viewings", options)
        .then(resp => resp.json())
        .then(viewings => viewings.tokenised_url);
};

const f1tvGetUpcomingEvents = () => {
    return fetch("https://f1tv-api.formula1.com/agl/1.0/can/en/all_devices/global/event-occurrence/current-season/upcoming")
    .then(resp => resp.json())
    .then(upcoming => upcoming.objects);
};

const f1tvGetAuthStreamLinkFromSlug = (sessionSlug, username, password) => {
    return f1tvAuthenticate(username, password)
    .then(auth => {
        return f1tvGetSessionId(sessionSlug, auth)
        .then(sessionId => {
            return f1tvGetSessionChannelUrl(sessionId)
            .then(sessionChannelUrl => {
                return f1tvGetTokenizedUrl(sessionChannelUrl, auth);
            });
        });
    });
};

const f1tvGetEventDetails = eventId => {
    return fetch(`https://f1tv-api.formula1.com/agl/1.0/can/en/all_devices/global/event-occurrence/${eventId}/`)
    .then(resp => resp.json());
};

const f1tvGetDetailedUpcomingEvents = () => {
    return f1tvGetUpcomingEvents()
    .then(upcomingEvents => Promise.all(upcomingEvents.map(event => f1tvGetEventDetails(event.uid))))
};

module.exports.f1tvGetAuthStreamLinkFromSlug = f1tvGetAuthStreamLinkFromSlug;
module.exports.f1tvGetDetailedUpcomingEvents = f1tvGetDetailedUpcomingEvents;