import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { API_URL } from "../config";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    // Sync token state with localStorage periodically or on events
    const checkToken = () => {
      const currentToken = localStorage.getItem("token");
      if (currentToken !== token) {
        setToken(currentToken);
      }
    };
    
    const interval = setInterval(checkToken, 2000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (token) {
      if (socket) {
        if (socket.auth?.token === token && socket.connected) return;
        socket.close();
      }

      console.log("[SOCKET] Initializing connection...");
      const newSocket = io(API_URL.replace("/api", ""), {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5
      });

      newSocket.on("connect", () => {
        console.log("[SOCKET] Connected successfully");
      });

      newSocket.on("connect_error", (err) => {
        console.error("[SOCKET] Connection error:", err.message);
      });

      setSocket(newSocket);

      return () => {
        console.log("[SOCKET] Cleaning up connection...");
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};