const express = require('express');
const http = require('http');
const socketio = require('socketio');
const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static('public'));
