var emitSocket = {};
var socket;
$(function(){

    socket = io();
    //emitSocket.socket = io();
    emitSocket.userJoin = function(user){

        socket.emit('user:join', user);
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