var request = require('request');
var _ = require('lodash');

var text = [
    'User Alexander Scott changed issue:\nWMS-90 Notification Integration To Slack\nhttps://***REMOVED***.myjetbrains.com/youtrack/issue/WMS-90\n--------------------\nState: In Progress->Reopened\nStatus: CodeShop->Production\n--------------------\nYou received this message because you had enabled notifications for "Unassigned in WMS" saved search and etc.'
    , 'User Alexander Scott changed issue:\nWMS-90 Notification Integration To Slack\nhttps://***REMOVED***.myjetbrains.com/youtrack/issue/WMS-90\n--------------------\nAssignee: Unassigned->Alexander Scott\n--------------------\nYou received this message because you had enabled notifications for "Unassigned in WMS" saved search and etc.'
    , 'User Alexander Scott changed issue:\nWMS-90 Notification Integration To Slack\nhttps://***REMOVED***.myjetbrains.com/youtrack/issue/WMS-90\n--------------------\nSummary: CloudPipe Integration To Slack->Notification Integration To Slack\nComment: Test of comment\nhttps://***REMOVED***.myjetbrains.com/youtrack/issue/WMS-90#comment=93-40\nType: Bug->Feature\n--------------------\nYou received this message because you had enabled notifications for "Unassigned in WMS" saved search and etc.'
    , 'New issue was reported by Alexander Scott:\nWMS-94 Slack Email Notification Test\nhttps://***REMOVED***.myjetbrains.com/youtrack/issue/WMS-94\n--------------------\nIssue was created at 15 Feb 2016 21:24\nDescription: null->This should get sent correctly.\nSummary: null->Slack Email Notification Test\n--------------------\nYou received this message because you had enabled notifications for "WMS" saved search and etc.'
    , 'User Alexander Scott changed issue:\nWMS-94 Slack Email Notification Test\nhttps://***REMOVED***.myjetbrains.com/youtrack/issue/WMS-94\n--------------------\nState: Submitted->In Progress\n--------------------\nYou received this message because you had enabled notifications for "WMS" saved search and etc.'
];

var usefulProperties = ['Status', 'State', 'Type'];

function postToSlack(data) {
    //***REMOVED***
    var formatted = "";

    var summary = _.get(data, 'payload.summary');
    var send = false;

    if (summary && summary.match(/^null/)) {
        formatted += "*Created Issue*: ";
        send = true;
    } else {
        formatted += "*Updated Issue*: ";
    }

    formatted += data.summary + "\n```\n";

    _.forEach(_.keys(data.payload), function (value) {
        if (_.includes(usefulProperties, value)) {
            send = true;
            formatted += value + ": " + data.payload[value] + ",\t";
        }
    });
    formatted += "\n```\n" + data.link;

    if (!send) {
        return;
    }

    var options = {
        uri: '***REMOVED***',
        method: 'POST',
        json: {
            text: formatted,
            username: "YouTrackGhost",
            icon_emoji: ":ghost:"
        }
    };

    request(options, function (err, response, body) {
        console.log(err, body);
        if (!err && response.statusCode == 200) {
            console.log(body); // Print the shortened url.
        }
    });

}

text.forEach(function (t) {
    var detail = {
        payload: {}
    };

    var parts = t.split(/\r?\n/);
    detail.summary = parts[1];
    detail.link = parts[2];
    var stat;
    var update;

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

});

