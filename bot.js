'use strict';

require('dotenv').config();
var SlackBot = require('slackbots');
var qs = require('querystring');
var express = require('express');
const args = require('minimist')(process.argv.slice(2));

const token = process.env.TOKEN;

// create a bot
var bot = new SlackBot({
	token, // Add a bot https://my.slack.com/services/new/bot and put the token 
	name: 'Merge Queue'
});

var queue = [];
var app = express();

app.use(express.json());

app.post('/', function (request, response) {
	const event = request.body.event;
	if (event && event.type === 'app_mention') {
		const command = event.text.split(' ')[1].toLowerCase();
		if (command) {
			handleCommand(event, command);
		}
	}
	response.send(request.body);    // echo the result back
});

app.get('/', function (request, response) {
	response.send('MergeQueue is online');
});

function handleCommand(event, command) {
	if (command === 'merge') {
		addToQueue(event.channel, event.user);
	}
	else if (command === 'done') {
		doneMerging(event.channel, event.user);
	}
	else if (command === 'queue') {
		printQueue(event.channel);
	}
	else if(command === 'kick') {
		kickUserFromQueue(event.channel, event.user, event.text.split(' ')[2]);
	}
}

function addToQueue(channel, user) {
	if (!queue[channel]) {
		queue[channel] = [];
	}
	if (queue[channel].indexOf(user) == -1) {
		queue[channel].push(user);
		if (queue[channel].length > 1) {
			bot.postMessage(channel, '<@' + user + '> has been added to the merge queue, position ' + queue[channel].length);
		} else {
			bot.postMessage(channel, '<@' + user + '> You can merge now, good luck!');
		}
	} else {
		bot.postMessage(channel, '<@' + user + '> Hold your horses, you are already in the queue!');
	}
}

function doneMerging(channel, user) {
	if (queue[channel] && queue[channel][0] === user) {
		bot.postMessage(channel, '<@' + user + '> Has merged successfully!');
		queue[channel].pop(user);
		if (queue.length > 0) {
			bot.postMessage(message.channel, '<@' + queue[0] + '> You can merge now, good luck!');
		}
	} else {
		bot.postMessage(channel, '<@' + user + '> You aren\'t even merging!');
	}
}

function printQueue(channel) {
	if (queue[channel] && queue[channel].length) {
		var queueMessage = 'Current queue:';
		for (var user of queue[channel]) {
			queueMessage += '\n<@' + user + '>';
		}

		bot.postMessage(channel, queueMessage);
	} else {
		bot.postMessage(channel, 'There is no queue, get back to work!');
	}
}

function kickUserFromQueue(channel, user, userToKick) {
	const regExp = /<@(.*?)\>/;
	const userToKickId = regExp.exec(userToKick)[1];

	if(queue[channel] && queue[channel].indexOf(userToKickId) >= 0) {
		queue[channel].pop(userToKickId);
		bot.postMessage(channel, userToKick + ' has been kicked by <@' + user + '>');
	} else {
		bot.postMessage(channel, userToKick + ' is not even in the queue!');
	}
}

// DO NOT DO app.listen() unless we're testing this directly
if (require.main === module) { app.listen(80); }

// Instead do export the app:
module.exports = app;