var mailin = require('mailin');
var _ = require('lodash');

var request = require('request');

mailin.start({
    port: 25252,
    disableWebhook: true // Disable the webhook posting.
});

var usefulProperties = ['Status', 'State', 'Type'];

function postToSlack(data) {
    var formatted = "";

    var summary = _.get(data, 'payload.summary');
    var send = false;

    if (summary && summary.match(/^null/)) {
        formatted += "*Created Issue*: ";
        send = true;
    } else {
        formatted += "*Updated Issue*: ";
    }

    formatted += "<" + data.link + "|" + data.summary + ">\n```\n";

    _.forEach(_.keys(data.payload), function (value) {
        if (_.includes(usefulProperties, value)) {
            send = true;
            formatted += value + ": " + data.payload[value] + ",\t";
        }
    });
    formatted += "\n```";

    if (!send) {
        return;
    }

    var options = {
        uri: process.env.slack_hook,
        method: 'POST',
        json: {
            text: formatted,
            username: "YouTrackGhost",
            icon_emoji: ":ghost:"
        }
    };

    request(options, function (err, response, body) {
        if (err) {
            console.log(err, body); // Print the shortened url.
        }
    });

}

mailin.on('message', function (connection, data, content) {

    if (data.envelopeFrom.address === 'no_reply@jetbrains.com' && data.envelopeTo[0].address === process.env.email) {

        var detail = {
            payload: {}
        };

        var parts = data.text.split(/\r?\n/);
        detail.summary = parts[1];
        detail.link = parts[2];

        var stat, update;

        for (var i = 4; i < parts.length - 2; i++) {
            stat = parts[i].match(/([^:]*):\s(.*)/);

            if (stat && stat.length >= 3) {
                update = stat[2].match(/^(.*)->(.*)/);

                if (update) {
                    detail.payload[stat[1]] = update[2];
                } else {
                    detail.payload[stat[1]] = stat[2];
                }
            }
            stat = null;
        }
        postToSlack(detail);
    }

});