import { io, Socket } from "socket.io-client";
import { getSocketUrl } from "../../lib/api";

const SOCKET_URL = getSocketUrl(); // Use the utility function

let socket: Socket | null = null;

export const initiateSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }
  return socket;
};

export const getSocket = (): Socket => {
  if (!socket) {
    socket = initiateSocket();
  }
  return socket;
};

export default socket;