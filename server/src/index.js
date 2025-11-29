const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { setupSocket } = require('./socket');
const apiRoutes = require('./api');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// WebSocket Setup
setupSocket(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
    console.log(`Sentinel Server running on port ${PORT}`);
});
