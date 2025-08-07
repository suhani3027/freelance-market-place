import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // Update if your backend runs elsewhere

let socket: Socket | null = null;

export const initiateSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
};