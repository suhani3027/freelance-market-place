const socketHandler = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', (data) => {
      socket.join(data.room);
    });

    socket.on('joinRoom', (room) => {
      socket.join(room);
    });

    socket.on('sendMessage', ({ msg, room }) => {
      io.to(room).emit('receiveMessage', msg);
    });

    socket.on('disconnect', () => {
      // User disconnected
    });
  });

  // Function to emit payment notifications
  io.emitPaymentNotification = (freelancerEmail, notificationData) => {
    io.emit('paymentNotification', {
      recipient: freelancerEmail,
      ...notificationData
    });
  };
};

export default socketHandler;
