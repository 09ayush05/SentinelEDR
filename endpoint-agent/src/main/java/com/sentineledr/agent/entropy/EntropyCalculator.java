package com.sentineledr.agent.entropy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class EntropyCalculator {

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
    private static final long MIN_FILE_SIZE_BYTES = 256;

    public double calculate(String filePath) {
        try {
            Path path = Paths.get(filePath);
            if (!Files.exists(path) || !Files.isRegularFile(path)) return -1;
            long fileSize = Files.size(path);
            if (fileSize < MIN_FILE_SIZE_BYTES || fileSize > MAX_FILE_SIZE_BYTES) return -1;
            byte[] bytes = Files.readAllBytes(path);
            return calculateFromBytes(bytes);
        } catch (IOException e) {
            return -1;
        }
    }

    public double calculateFromBytes(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return 0.0;
        long[] frequency = new long[256];
        for (byte b : bytes) {
            frequency[b & 0xFF]++;
        }
        double entropy = 0.0;
        double total = bytes.length;
        for (long count : frequency) {
            if (count == 0) continue;
            double probability = count / total;
            entropy -= probability * (Math.log(probability) / Math.log(2));
        }
        return entropy;
    }

    public String classify(double entropy) {
        if (entropy < 0)   return "UNREADABLE";
        if (entropy < 3.5) return "LOW (plaintext/structured)";
        if (entropy < 6.0) return "MEDIUM (text/code)";
        if (entropy < 7.5) return "HIGH (compressed)";
        if (entropy < 7.9) return "VERY HIGH (compressed/encrypted)";
        return "MAXIMUM (likely encrypted)";
    }

    public boolean isEncryptionDelta(double before, double after) {
        if (before < 0 || after < 0) return false;
        double delta = after - before;
        return delta > 2.5 && after > 7.5;
    }
}
