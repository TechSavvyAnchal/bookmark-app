import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import { API_URL } from "../config";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token && (!socket || socket.auth?.token !== token)) {
      if (socket) socket.close();

      const newSocket = io(API_URL.replace("/api", ""), {
        auth: { token }
      });

      newSocket.on("connect", () => {
        console.log("[SOCKET] Connected to server");
      });

      setSocket(newSocket);
    } else if (!token && socket) {
      socket.close();
      setSocket(null);
    }
  }, [location.pathname]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};