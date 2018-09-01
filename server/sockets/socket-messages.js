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
	

	io.on('connection', function(socket) {
		//console.log("socket*********************", socket);
		console.log("userArray", userArray);
		connections.push(socket);
		console.log("connections", connections.length);
		console.log("clients", io.sockets.clients().server.sockets.adapter.rooms);

		// id:  user_id}
		socket.on('user:join', function(user) {
			socket.join(user.id);
			socket.userId = user.id;
			console.log("****socket.userId", socket.userId);
			if (userArray.indexOf(user.id) == -1) {
				userArray.push(user.id);
			} else {
				console.log("user already connected");
			}
			console.log("clients rooms connected", io.sockets.clients().server.sockets.adapter.rooms);
			socket.broadcast.emit('user:online', userArray);
			//	userOnline(user);
		});

		socket.on('user:get_online_users', function(test) {
			io.emit('user:online', userArray);
		})

		// {id: user_id}
		socket.on('user:leave', function(user) {
			console.log("logout array before", userArray);
			console.log("USER LOGOUT", user);
			socket.leave(user);
			if (userArray.indexOf(user) == -1) {
				console.log("user already removed");
			} else {
				console.log('logout..');
				var userIndex = userArray.indexOf(user.id);
				userArray.splice(userIndex, 1);
				io.emit('user:online', userArray);
			}
			//	userOffline(user);
			console.log("logout userArray", userArray);
			socket.broadcast.emit('userOnline', userArray);
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
				var threadObj = _.find(talkThreadArray, function(obj) {
					return obj.thread == thread.id;
				});
				console.log("threadObj", threadObj);
				if (threadObj.users.indexOf(thread.user) == -1) {
					console.log("push new user");
					threadObj.users.push(thread.user);
				}
			}
			console.log("After talkThreadArray", talkThreadArray);
		});
		
		// {id: threadid, message:"Hello", from: user_id, to_id: user_id}
		socket.on('chat:send', function(talk) {

			return talkCreate(talk).then(function(result) {
				console.log("RESULT", result);
				result.to_id = talk.to_id;
				var talkThreadCheck = _.find(talkThreadArray, function(threadArrObj) {
					return threadArrObj.thread == result.talk_thread_id
				});
				console.log("talkThreadCheck", talkThreadCheck);
				if (talkThreadCheck.users.indexOf(talk.to_id) == -1) {
					console.log("userArray", userArray);
					var userId = _.find(userArray, function(userArrObj) {
						console.log("userArrObj result.talk_thread_id", userArrObj, talk.to_id);
						return userArrObj == talk.to_id
					});
					if (userId) {
						console.log("opposite user is in online, sending msg to his room... & send also your thread room");
						io.to(talk.to_id).to(result.talk_thread_id).emit('chat:receive', result);
					} else {
						io.to(result.talk_thread_id).emit('chat:receive', result);
						console.log("oppsite user offline, emitted only for your thread room");
					}
					//io.to(result.talk_thread_id).emit('chat:receive', result);
				} else {
					console.log("Two Users are in that room, emitted in that room");
					io.to(result.talk_thread_id).emit('chat:receive', result);
				}
			})
		});
		
		//{id: thread_id, user: user_id}
		socket.on('chat:leave', function(talk) {
			socket.leave(talk.id);
			var talkThreadLeave = _.find(talkThreadArray, function(threadArrObj) {
				return threadArrObj === talk.id;
			})
			if (talkThreadLeave.users.indexOf(talk.user) == -1) {
				console.log("user not in that array");
			} else {
				var index = talkThreadLeave.users.indexOf(talk.user);
				talkThreadLeave.users.splice(index, 1);
			}
		});

		socket.on('disconnect', function() {
			console.log("disconnect", socket.userId);
			console.log("userArray in disconnect***********8", userArray);
			console.log("clients when disconnect**", io.sockets.clients().server.sockets.adapter.rooms);
			connections.splice(connections.indexOf(socket), 1);
			console.log("%s length", connections.length);
			if (socket.userId != null) {
				if (userArray.indexOf(socket.userId) > -1) {
					console.log("%s disconnected", socket.userId)
					socket.join(socket.userId.toString());
					console.log("%s connected", socket.userId)
				}
			}
			//console.log("%s Disconnected", socket.userId);
		})
	})
}