
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
    query: { clientType: "agent" },
});

const ENDPOINT_ID = "test-endpoint-001";

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

socket.on("connect", async () => {
    console.log("[test-agent] connected:", socket.id);

    // 1. Register endpoint (matches your "endpoint:register" handler)
    socket.emit("endpoint:register", {
        endpointId: ENDPOINT_ID,
        hostname: "TEST-PC",
        agentVersion: "1.0.0-test",
        watchedPaths: ["C:\\Users\\test\\Documents"],
        osInfo: "Windows 11",
    });
    console.log("[test-agent] sent endpoint:register");

    await wait(1000);

    // 2. Send a file event (matches your "agent:fileEvent" handler / FileEvent model)
    socket.emit("agent:fileEvent", {
        endpointId: ENDPOINT_ID,
        eventType: "MODIFIED",
        filePath: "C:\\Users\\test\\Documents\\report.docx",
        fileExtension: ".docx",
        fileSizeBytes: 204800,
        entropyBefore: 3.2,
        entropyAfter: 3.4,
        riskScore: 22,
        detectedAt: new Date().toISOString(),
    });
    console.log("[test-agent] sent agent:fileEvent");

    await wait(1000);

    // 3. Send a high-severity alert (matches your "agent:alert" handler / Alert model)
    socket.emit("agent:alert", {
        endpointId: ENDPOINT_ID,
        hostname: "TEST-PC",
        severity: "critical",
        riskScore: 92,
        title: "Suspected ransomware activity",
        description: "Mass file modification with high entropy delta detected",
        filePath: "C:\\Users\\test\\Documents\\report.docx.locked",
    });
    console.log("[test-agent] sent agent:alert");

    await wait(1000);
    console.log("[test-agent] done, disconnecting");
    socket.disconnect();
    process.exit(0);
});

socket.on("endpoint:updated", (data) => {
    console.log("[test-agent] received endpoint:updated:", data);
});

socket.on("connect_error", (err) => {
    console.error("[test-agent] connect_error:", err.message);
    process.exit(1);
});