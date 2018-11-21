import _ from 'lodash';
const uuidv1 = require('uuid/v1');
var talkCreate = require('../api/talk/talk.controller').talkCreate;
var talkCount = require('../api/talk/talk.controller').talkCount;

export function socketMsg(io) {
	console.log("Socket.IO is working");
	var userArray = [];
	var talkThreadArray = [];
	var connections = [];
	var callRooms = {};
	var userSockets = {};


	io.sockets.on('connection', function (socket) {
		connections.push(socket.id);

		socket.on('user:join', function (user) {
			socket.join(user);
			socket.userId = user;
			
			if (userSockets[user] == undefined)
				userSockets[user] = [];

			if (userArray.indexOf(user) == -1) {
				userArray.push(user);
				userSockets[user].push(socket.id);				
			} else {
				userSockets[user].push(socket.id);
			}
			socket.broadcast.emit('user:online', userArray);

		});

		socket.on('user:get_online_users', function (test) {
			io.emit('user:online', userArray);
		})

		socket.on('user:leave', function (user) {
			if (userSockets[user].indexOf(socket.id) != -1) {
				userSockets[user].splice(userSockets[user].indexOf(socket.id), 1);
				if (userSockets[user].length == 0) {
					socket.leave(user);
					userArray.splice(userArray.indexOf(socket.userId), 1);
					io.emit('user:online', userArray);
				}
			}
			socket.broadcast.emit('userOnline', userArray);
		});

		//{id: 1, user: user_id}
		socket.on('chat:join', function (thread) {
			//console.log("CHAT JOIN ON CODE", thread);
			//console.log("clients rooms connected", io.sockets.clients().server.sockets.adapter.rooms);
			//console.log("Before talkThreadArray", talkThreadArray);
			socket.join(thread.id);

			if (_.map(talkThreadArray, 'thread').indexOf(thread.id) == -1) {
				//	console.log("Thread id not found pushed new");
				var obj = {
					thread: thread.id,
					users: [thread.user]
				}
				talkThreadArray.push(obj);
			} else {
				var threadObj = _.find(talkThreadArray, function (obj) {
					return obj.thread == thread.id;
				});
				//console.log("threadObj", threadObj);
				if (threadObj.users.indexOf(thread.user) == -1) {
					console.log("push new user");
					threadObj.users.push(thread.user);
				}
			}
			//console.log("After talkThreadArray", talkThreadArray);
		});

		// {id: threadid, message:"Hello", from: user_id, to_id: user_id}
		socket.on('chat:send', function (talk) {

			return talkCreate(talk).then(function (result) {
				console.log("RESULT", result);
				talkCount(talk.to_id).then(function (res) {
					console.log("RESULT_____________________", res);
					io.to(result.from_id).emit('chat:count:receive', res);
				})
				result.to_id = talk.to_id;
				var talkThreadCheck = _.find(talkThreadArray, function (threadArrObj) {
					return threadArrObj.thread == result.talk_thread_id
				});
				//console.log("talkThreadCheck", talkThreadCheck);
				if (talkThreadCheck.users.indexOf(talk.to_id) == -1) {
					//console.log("userArray", userArray);
					var userId = _.find(userArray, function (userArrObj) {
						console.log("userArrObj result.talk_thread_id", userArrObj, talk.to_id);
						return userArrObj == talk.to_id
					});
					if (userId) {
						//	console.log("opposite user is in online, sending msg to his room... & send also your thread room");
						io.to(talk.to_id).to(result.talk_thread_id).emit('chat:receive', result);
					} else {
						io.to(result.talk_thread_id).to(talk.to_id).emit('chat:receive', result);
						//	console.log("oppsite user offline, emitted only for your thread room");
					}
					//io.to(result.talk_thread_id).emit('chat:receive', result);
				} else {
					//console.log("Two Users are in that room, emitted in that room");
					io.to(result.talk_thread_id).to(talk.to_id).emit('chat:receive', result);
				}

			})
		});

		socket.on('chat:count', function (user) {
			//console.log("CONSOLE.log CHAT COUNT***********************",user);
			return talkCount(user).then(function (result) {
				//console.log("RESULT_____________________", result);
				io.to(user).emit('chat:count:receive', result);
			})
		})

		//{id: thread_id, user: user_id}
		socket.on('chat:leave', function (talk) {
			socket.leave(talk.id);
			var talkThreadLeave = _.find(talkThreadArray, function (threadArrObj) {
				return threadArrObj === talk.id;
			})
			if (talkThreadLeave.users.indexOf(talk.user) == -1) {
				console.log("user not in that array");
			} else {
				var index = talkThreadLeave.users.indexOf(talk.user);
				talkThreadLeave.users.splice(index, 1);
			}
		});

		socket.on('disconnect', function () {
			console.log("userArray in disconnect***********", userArray);
			connections.splice(connections.indexOf(socket), 1);
			if (socket.userId && userSockets[socket.userId].indexOf(socket.id) != -1) {
				userSockets[socket.userId].splice(userSockets[socket.userId].indexOf(socket.id), 1);
				if (userSockets[socket.userId].length == 0) {
					userArray.splice(userArray.indexOf(socket.userId), 1);
					io.emit('user:online', userArray);
				}
			}
			socket.broadcast.emit('userOnline', userArray);
		})

		/* Start - For Web rtc Signalling*/

		socket.on('call:preinit', (callObj) => {
			//caller
			callObj['callUniqueId'] = uuidv1();
			io.to(callObj.callFrom).emit('call:preinit', callObj);
		});

		socket.on('call:init', (callObj) => {
			console.log("========== Incoming Video call ===========", callObj);
			callObj['isInitiator'] = true;
			io.to(callObj.callFrom).emit('call:init', callObj);

			//callee
			callObj['isInitiator'] = false;
			io.to(callObj.callTo).emit('call:incoming', callObj);

			console.log("incoming Video call Init to - ", callObj['callUniqueId'])
		});

		socket.on('call:rejected', (callObj) => {
			if (!callObj.callAcceptStatus) {
				console.log("Caller call reject by the callee", callObj);
				io.to(callObj.callFrom).emit('call:rejected', callObj);
			}
		});

		socket.on('call:join', (callObj) => {
			if (callObj) {
				let room = callObj.callUniqueId;
				let clientsInRoom = io.sockets.adapter.rooms[room];
				let numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;

				if (!callRooms.hasOwnProperty(room)) {
					callRooms[room] = {};
					callRooms[room]['callRoomUsers'] = [];
					callRooms[room]['callRoomUsers'].push(callObj.callFrom);
				} else {
					let index = callRooms[room]['callRoomUsers'].indexOf(callObj.callTo);
					if (index == -1) {
						callRooms[room]['callRoomUsers'].push(callObj.callTo);
					}
				}

				if (numClients === 0) {
					console.log("New Room Created for the Call");
					socket.join(room);
					console.log(callRooms, "000", io.sockets.adapter.rooms[room]);
					return io.to(callObj.callFrom).emit('call:joined', callObj);
				} else if (numClients === 1) {
					console.log("Room Already Exists Joining the room");
					socket.join(room);
					console.log(callRooms, "1111", io.sockets.adapter.rooms[room])
					return io.to(callObj.callTo).emit('call:joined', callObj);
				} else {
					console.log("Room is full - 2 Pleople Already exist")
					console.log(callRooms, "2222", io.sockets.adapter.rooms[room])
					//handle room full
				}
			}

		});

		socket.on('call:accepted', (callObj) => {
			//to caller
			callObj['isInitiator'] = true;
			callObj['callAcceptStatus'] = true;
			callObj['callAcceptedOn'] = new Date();
			io.to(callObj.callFrom).emit('call:accepted', callObj);
		});

		socket.on('call:icecandidate', (callObj) => {
			console.log("Received call:icecandidate");
			socket.to(callObj.callUniqueId).emit('call:icecandidate', callObj);
		});

		socket.on('call:offer', (callObj) => {
			console.log("caller shared offer");
			io.to(callObj.callTo).emit('call:offer', callObj);
		});

		socket.on('call:answer', (callObj) => {
			console.log("callee shared answer");
			io.to(callObj.callFrom).emit('call:answer', callObj);
		})

		socket.on('call:leave', function(callObj) {
			if (callObj) {
				callRooms[callObj.callUniqueId] = [];
				delete callRooms[callObj.callUniqueId];
				socket.leave(callObj.callUniqueId);
				io.to(callObj.userId).emit("call:handled", {});
			}
		});


		/** End - For Web rtc Signalling*/

	})
}