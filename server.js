const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve HTML files
app.use(express.static(path.join(__dirname)));

// Store online models
const onlineModels = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Model goes online
  socket.on('model-online', (data) => {
    onlineModels.set(data.modelId, {
      socketId: socket.id,
      peerId: data.peerId,
      name: data.name,
      price: data.price
    });
    console.log(`Model ${data.name} online`);
  });
  
  // User wants to call model
  socket.on('call-model', (data, callback) => {
    const model = onlineModels.get(data.modelId);
    if (model) {
      // Tell model about the call
      io.to(model.socketId).emit('incoming-call', {
        callerId: data.callerId,
        callerName: data.callerName,
        price: model.price
      });
      callback({ success: true, modelPeerId: model.peerId });
    } else {
      callback({ success: false, error: 'Model offline' });
    }
  });
  
  // Relay WebRTC signals
  socket.on('signal', (data) => {
    socket.broadcast.emit('signal', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
