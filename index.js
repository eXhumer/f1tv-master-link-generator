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

const f1tvUtils = require("./f1tvutils");
const yargs = require("yargs");

yargs
    .scriptName("f1-viewer")
    .usage("$0 <cmd> [args]")
    .command({
        command: "get-auth-url [sessionslug] [username] [password]",
        describe: "Get authenticated stream URL from session slug",
        builder: yargs => {
            yargs
                .positional("sessionslug", {
                    type: "string",
                    describe: "The session slug of the session to get authenticated URL for"
                })
                .positional("username", {
                    type: "string",
                    describe: "F1TV Account Email Address"
                })
                .positional("password", {
                    type: "string",
                    describe: "F1TV Account Password"
                })
        },
        handler: argv => {
            f1tvUtils.f1tvAuthenticate(argv.username, argv.password)
            .then(auth => {
                f1tvUtils.f1tvGetSessionId(argv.sessionslug, auth)
                .then(sessionId => {
                    f1tvUtils.f1tvGetSessionChannelUrl(sessionId)
                    .then(sessionChannelUrl => {
                        f1tvUtils.f1tvGetTokenizedUrl(sessionChannelUrl, auth)
                        .then(tokenizedUrl => {
                            console.log(tokenizedUrl);
                        })
                        .catch(err => console.log("Failed to generate tokenized URL!"));
                    })
                    .catch(err => console.log("Failed to get session channel URL!"));
                })
                .catch(err => console.log("Failed to get session ID from session slug!"));
            })
            .catch(err => console.log("Failed to get session ID from session slug!"));
        }
    })
    .help()
    .argv;