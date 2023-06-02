const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

const port = 3000;

io.on("connection", (socket) => {
  console.log("A client has connected");

  socket.on("join", () => {
    socket.emit("startGame");
  });

  socket.on("disconnect", () => {
    console.log("A client has disconnected");
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
