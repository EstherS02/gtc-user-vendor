export function socketMsg(io) {
   
    io.on('connection', function(socket) {

        console.log("connected========================================socket io working");

        connections.push(socket);
        console.log('A user connected %s', connections.length);
     
        socket.on('disconnect', function (data) {
          connections.splice(connections.indexOf(socket),1);
        });

        socket.on('send message',function(data){
            io.socket.emit('new message',{ msg:data})

        });
     });
}