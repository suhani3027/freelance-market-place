const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('sendMessage', ({ msg, room }) => {
      io.to(room).emit('receiveMessage', msg);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
};

export default socketHandler;
