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
    .argv