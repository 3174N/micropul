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

const port = 3000; // Replace with your desired port number

io.on("connection", (socket) => {
  console.log("A client has connected");

  // Event listener for receiving messages from the client
  socket.on("message", (data) => {
    console.log("Received message:", data);

    // Echo the message back to the client
    socket.emit("message", data);
  });

  // Event listener for when the client disconnects
  socket.on("disconnect", () => {
    console.log("A client has disconnected");
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
