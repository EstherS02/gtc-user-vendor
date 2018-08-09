
var userOnline = require('../api/users/users.controller').userOnline;
var userOffline = require('../api/users/users.controller').userOffline;
var msgCreate = require('../api/message/message.controller').msgCreate;
import _ from 'lodash';

export function socketMsg(io) {
	// console.log("io",io)
	console.log("socket io working");
	var threadArray = [];
	var userArray = [];

	io.on('connection', function(socket) {

		console.log("clients", io.sockets.clients().server.sockets.adapter.rooms);

		socket.on('user:join', function(user) {
			socket.userId = user._id;
			socket.join(user._id);
			if(userArray.indexOf(user._id.toString()) == -1){
				userArray.push(user._id.toString());
			} else {
				console.log("user already connected");
			}
			
			//console.log("user Join Array", userArray);
			userOnline(user);
		});

		socket.on('user:leave', function(user) {

			//socket.userId = user._id;
			socket.leave(user._id);
			var userLeave = _.find(userArray, function(obj) {
				return obj.userArray == user._id
			});
			//console.log("userArray", userArray);
			var userIndex = userArray.indexOf(user._id.toString());
			userArray.splice(userIndex, 1);
			userOffline(user);
			//console.log("User Leave array", userArray);
		});

		// thread : {id: 5b5067ce15c4e462fd43732a, user: user.id}
		// threadArr = [{thread : id, users: [ids] }]
		socket.on('chat:join', function(thread) {
			socket.join(thread.id.toString());

			if (_.map(threadArray, 'thread').indexOf(thread.id) == -1) {
				var obj = {
					thread: thread.id,
					users: [thread.user]
				};
				threadArray.push(obj);
			} else {
				var threadObj = _.find(threadArray, function(obj) {
					return obj.thread.toString() === thread.id.toString();
				});

				if (threadObj.users.indexOf(thread.user) == -1) {
					threadObj.users.push(thread.user);
				}
			}
		});

		// messages: { thread: id, message: "hi", send: "userid", to:[touserId]}
		socket.on('chat:send', function(threadObj) {
			console.log("threadObj", threadObj);
			return msgCreate(threadObj).then(function(result) {
				//console.log("*****************result********************", result);
				var toThreads = threadObj.to;
				if (toThreads.length > 2) {
					console.log("Group chat");
					var onlineUsers = _.intersection(userArray, toThreads);
					
					var threadCheck = _.find(threadArray, function(obj) {
						return obj.thread.toString() === threadObj.thread.toString();
					});
					var threadJoinedUsers = threadCheck.users;

					var sendToThread = _.intersection(threadJoinedUsers, onlineUsers);
					if(sendToThread.length > 0){
						console.log("sendToThread", sendToThread);
						io.to(threadObj.thread.toString()).emit('chat:receive', result);
					}

					var sendToUsersRoom = _.difference(onlineUsers, threadJoinedUsers);
					if(sendToUsersRoom.length > 0){
						console.log("sendToUsersRoom", sendToUsersRoom);
						sendToUsersRoom.forEach(function(toUser){
							var notify = [toUser];
							PushNotifications.sendPushNotification(result, notify);
							console.log("Users Room", toUser);
							io.to(toUser.toString()).emit('chat:receive', result);
						});
					}

					var pushNotifyUsers = _.difference(toThreads, userArray);
					if(pushNotifyUsers.length > 0){
						console.log("Users doesn't in app", pushNotifyUsers);
						PushNotifications.sendPushNotification(result, pushNotifyUsers);
						/*pushNotifyUsers.forEach(function(toUser){
						console.log("PushNotification Users", toUser);
							io.to(toUser.toString()).emit('chat:receive', result);
						});	*/
					}
				} else {
					console.log("Individual chat");
					var threadCheck = _.find(threadArray, function(obj) {
						return obj.thread.toString() === threadObj.thread.toString();
					});
					//console.log("threadObj.to Before", threadObj.to);
					var sendUserSplice = threadObj.to.indexOf(threadObj.send.toString());
					threadObj.to.splice(sendUserSplice, 1);
					//console.log("threadObj.to After", threadObj.to);
					//console.log("threadObj.to[0]", threadObj.to[0]);
					if (threadCheck.users.indexOf(threadObj.to[0]) == -1) {
						var userId = _.find(userArray, function(obj) {
							return obj.toString() === threadObj.to[0].toString()
						});
						console.log("userId", userId);
						if (userId) {
							console.log("send message in user room");
							io.to(userId.toString()).emit('chat:receive', result);
							var sendToUser = [userId];
							PushNotifications.sendPushNotification(result, sendToUser);
						} else {
							console.log("User doesn't in app");
							var sendToUser = [threadObj.to[0].toString()]
							PushNotifications.sendPushNotification(result, sendToUser);
						} 
						io.to(threadObj.send.toString()).emit('chat:receive', result);
					} else {
						console.log("send message in thread room")
						io.to(result.thread.toString()).emit('chat:receive', result);
					}
				}
			})
		});

		socket.on('chat:leave', function(thread) {
			socket.leave(thread.id);
			var threadLeave = _.find(threadArray, function(obj) {
				return obj.thread = thread.id;
			})
			if (threadLeave.users.indexOf(thread.user) == -1) {
				console.log("user not in that array");
			} else {
				var index = threadLeave.users.indexOf(thread.user);
				threadLeave.users.splice(index, 1);
			}
		});

		socket.on("disconnect", function() {
			console.log("Disconnected", socket.userId);
		});
	});
}