import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

// A single shared socket instance used across the room/quiz pages.
// autoConnect is false - we connect only when a user actually creates/joins a room.
const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;
