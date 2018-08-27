import _ from 'lodash';
var talkCreate = require('../api/talk/talk.controller').talkCreate;
var userOnline = require('../api/users/users.controller').userOnline;
var userOffline = require('../api/users/users.controller').userOffline;

export function socketMsg(io) {
	console.log("Socket.IO is working");
		var userArray = [];
		var talkThreadArray = [];
		var connections = [];
		console.log("userArray", userArray);
	io.sockets.on('connection', function(socket) {
		console.log("userArray", userArray);
		connections.push(socket);
		console.log("connections", connections.length);
		console.log("clients", io.sockets.clients().server.sockets.adapter.rooms);


		// id:  user_id}
		socket.on('user:join', function(user) {
			//console.log("USER", user);
		//	console.log("USER.ID", user.id);
			socket.join(user.id);
			socket.userId = user.id;
			if (userArray.indexOf(user.id) == -1) {
				userArray.push(user.id);
			} else {
				console.log("user already connected");
			}
			console.log("***********************user Array*************", userArray);
		//	userOnline(user);
			//SET USER AS ONLINE
		});

		// {id: user_id}
		socket.on('user:leave', function(user) {
			console.log("USER LOGOUT", user);
			socket.leave(user.id);
			if(userArray.indexOf(user.id) == -1){
				console.log("user already removed");
			} else {
				console.log('logout..');
				var userIndex = userArray.indexOf(user.id);
				userArray.splice(userIndex, 1);
			}
		//	userOffline(user);
			//SET USER AS OFFLINE
		});

		//{id: 1, user: user_id}
		socket.on('chat:join', function(thread) {
			console.log("CHAT JOIN ON CODE", thread);
			console.log("Before talkThreadArray", talkThreadArray);
			socket.join(thread.id);

			if (_.map(talkThreadArray, 'thread').indexOf(thread.id) == -1) {
				console.log("Thread id not found pushed new");
				var obj = {
					thread: thread.id,
					users: [thread.user]
				}
				talkThreadArray.push(obj);
			} else {
				console.log("push new user");
				var threadObj = _.find(talkThreadArray, function(obj) {
					return obj.thread == thread.id;
				});
				console.log("threadObj", threadObj);
				if (threadObj.users.indexOf(thread.user) == -1) {
					threadObj.users.push(thread.user);
				}
			}
			console.log("After talkThreadArray", talkThreadArray);
		});
		// {id: threadid, message:"Hello", from: user_id, to: user_id}
		socket.on('chat:send', function(talk) {
			console.log("TALK **********", talk);
			//task database
			return talkCreate(talk).then(function(result) {
				console.log("RESULT **************", result.talk_thread_id);
				io.to(result.talk_thread_id).emit('chat:receive', result)
				/*var talkThreadCheck = _.find(talkThreadArray, function(threadArrObj) {
					console.log("*******threadArrObj",threadArrObj);
					return threadArrObj = talk.id
				});
				if (talkThreadCheck.users.indexOf(talk.to) == -1) {
					var userId = _.find(userArray, function(userArrObj) {
						return userArrObj = talk.id
					});
					if (userId) {
						io.to(talk.to).emit('chat:receive', result);
					} else {
						console.log("user not in this page");
					}
					io.to(result.talk_thread_id).emit('chat:receive', result);
				} else {
					io.to(result.talk_thread_id).emit('chat:receive', result);
				}*/
			})
		});
		//{id: thread_id, user: user_id}
		socket.on('chat:leave', function(talk) {
			socket.leave(talk.id);
			var talkThreadLeave = _.find(talkThreadArray, function(threadArrObj){
				return threadArrObj === talk.id;
			})
			if(talkThreadLeave.users.indexOf(talk.user) == -1) {
				console.log("user not in that array");
			} else {
				var index = talkThreadLeave.users.indexOf(talk.user);
				talkThreadLeave.users.splice(index, 1);
			}
		});

		socket.on('disconnect', function() {
			console.log("userArray", userArray);
			connections.splice(connections.indexOf(socket), 1);
			console.log("%s length", connections.length);
			console.log("%s Disconnected", socket.userId);
		})
	})
}
