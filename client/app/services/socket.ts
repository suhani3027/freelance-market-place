import { io } from "socket.io-client";
import { getSocketUrl } from "../../lib/api";

const SOCKET_URL = getSocketUrl(); // Use the utility function

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;