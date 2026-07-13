import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    query: { clientType: "dashboard" },
});

socket.on("connect", () => {
    console.log("[test-dashboard] connected:", socket.id);
    socket.emit("dashboard:join");
});

socket.on("dashboard:joined", (data) => {
    console.log("[test-dashboard] joined dashboard room:", data);
    console.log("[test-dashboard] listening for events... (run test-agent.js now)");
});

socket.on("dashboard:fileEvent", (data) => {
    console.log("\n[test-dashboard] RECEIVED dashboard:fileEvent");
    console.log(data);
});

socket.on("dashboard:alert", (data) => {
    console.log("\n[test-dashboard] RECEIVED dashboard:alert");
    console.log(data);
});

socket.on("dashboard:alertUpdated", (data) => {
    console.log("\n[test-dashboard] RECEIVED dashboard:alertUpdated");
    console.log(data);
});

socket.on("connect_error", (err) => {
    console.error("[test-dashboard] connect_error:", err.message);
    process.exit(1);
});

console.log("[test-dashboard] waiting for connection...");