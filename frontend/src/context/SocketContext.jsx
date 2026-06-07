import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../config";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // 1. Monitor token changes in localStorage
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== token) {
        console.log("[SOCKET] Token changed, updating state...");
        setToken(currentToken);
      }
    };
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, [token]);

  // 2. Manage Socket Connection
  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        console.log("[SOCKET] No token, closing socket...");
        socketRef.current.close();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // If already connected with the same token, do nothing
    if (socketRef.current && socketRef.current.auth?.token === token && socketRef.current.connected) {
      return;
    }

    // Clean up old connection if token changed
    if (socketRef.current) {
      console.log("[SOCKET] Token mismatch or disconnected, reconnecting...");
      socketRef.current.close();
    }

    const socketUrl = API_URL.replace("/api", "");
    console.log("[SOCKET] Connecting to:", socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    newSocket.on("connect", () => {
      console.log("[SOCKET] Connected! ID:", newSocket.id);
      setSocket(newSocket);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected. Reason:", reason);
      // Don't set state to null immediately if it's just a transport error
      // as it will reconnect automatically
    });

    newSocket.on("connect_error", (err) => {
      console.error("[SOCKET] Connection error:", err.message);
    });

    socketRef.current = newSocket;

    return () => {
      if (newSocket) {
        console.log("[SOCKET] Component unmount - closing socket");
        newSocket.close();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
