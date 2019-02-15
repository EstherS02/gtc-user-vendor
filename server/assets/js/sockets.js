var emitSocket = {};
var socket;
$(function(){

  socket = io({
    transports: ['websocket','polling'],
    forceNew: true
  });
    socket.on('connect', () => {

     // console.log("socket.connected", socket);
     // console.log("userId", userId);
            if (userId != null) {
               // console.log("SOCKET INNNN", socket);
                socket.emit('user:join', userId);
            }
            socket.on('chat:receive', function(data) {
                if (userId != data.from_id) {
                   // console.log("user room emitting..", data);
                    toastr.options.closeButton = true;
                    toastr.options.showEasing = 'easeOutBounce';
                    toastr.options.showMethod = 'slideDown';
                    toastr.options.progressBar = true;
                    toastr.options.closeMethod = 'slideUp'
                    toastr.info(data.message, data.User.first_name, {
                        timeOut: 3000
                    });
                }
            }) 
    });
    emitSocket.userJoin = function(userInfo){
        console.log("userInfo in socket.js", userInfo);
      
    }
    emitSocket.userLeave = function(user){

        socket.emit('user:leave', user);
    }
    emitSocket.chatJoin = function(thread){

        socket.emit('chat:join', thread);
    }
    emitSocket.chatSend = function(talk){
        console.log("Chat Send onGoing..........");
        socket.emit('chat:send', talk);
    }
    emitSocket.chatLeave = function(talk){
        socket.emit('chat:leave', talk);
    }
});