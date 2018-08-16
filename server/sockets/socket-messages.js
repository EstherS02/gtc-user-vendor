import _ from 'lodash';
var msgCreate;
var userJoin;
var userLeave;

export function socketMsg(io) {
	console.log("Socket.IO is working");

	io.on('connection', function(socket) {
		var userArray = [];
		var talkThreadArray = [];
		// id:  user_id}
		socket.on('user:join', function(user) {
			socket.join(user.id);
			socket.userId = user.id;
			if (userArray.indexOf(user.id) == -1) {
				userArray.push(user.id);
			} else {
				console.log("user already connected");
			}
			userJoin(user);
			//SET USER AS ONLINE
		});

		// {id: user_id}
		socket.on('user:leave', function(user) {
			socket.leave(user.id);
			var userIndex = userArray.indexOf(user.id.toString());
			userArray.splice(userIndex, 1);
			userLeave(user);
			//SET USER AS OFFLINE
		});

		//{id: 1, user: user_id}
		socket.on('chat:join', function(thread) {
			socket.join(thread.id);

			if (_.map(talkThreadArray, 'thread').indexOf(thread.id) == -1) {
				var obj = {
					thread: thread.id,
					users: [thread.user]
				}
			} else {
				var threadObj = _.find(threadArray, function(obj) {
					return obj.thread.toString() == -thread.id.toString();
				});

				if (threadObj.users.indexOf(thread.user) == -1) {
					threadObj.users.push(thread.user);
				}
			}
		});
		// {id: threadid, message:"Hello", from: user_id, to: user_id}
		socket.on('chat:send', function(talk) {
			//task database
			return msgCreate(talk).then(function(result) {
				var talkThreadCheck = _.find(talkThreadArray, function(threadArrObj) {
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
					io.to(result.thread).emit('chat:receive', result);
				} else {
					io.to(result.thread).emit('chat:receive', result);
				}
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
			console.log("Disconnected", socket.userId);
		})
	})
}
