package com.sentineledr.agent.detector;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;

/**
 * Detects mass file modification - a key ransomware behavioral signal.
 *
 * Ransomware must modify many files quickly to encrypt them before
 * the user or security software intervenes. Normal user behavior
 * rarely involves modifying dozens of files within seconds.
 *
 * Implementation: sliding window counter.
 * We maintain a queue of timestamps of recent modification events.
 * On each new event, we remove timestamps older than the window,
 * then check if the remaining count exceeds our threshold.
 */
public class MassModificationDetector {

    private final int threshold;
    private final long windowSeconds;

    // Queue of timestamps of recent file modification events
    private final Deque<Instant> recentModifications = new ArrayDeque<>();

    public MassModificationDetector(int threshold, long windowSeconds) {
        this.threshold = threshold;
        this.windowSeconds = windowSeconds;
    }

    /**
     * Records a new file modification event and returns the current
     * modification rate score (0-25 contribution to risk score).
     */
    public synchronized int recordModification() {
        Instant now = Instant.now();
        recentModifications.addLast(now);

        // Remove events outside the sliding window
        Instant cutoff = now.minusSeconds(windowSeconds);
        while (!recentModifications.isEmpty() &&
               recentModifications.peekFirst().isBefore(cutoff)) {
            recentModifications.pollFirst();
        }

        int count = recentModifications.size();
        return scoreFromCount(count);
    }

    /**
     * Returns current count of modifications in the active window.
     */
    public synchronized int getCurrentCount() {
        return recentModifications.size();
    }

    /**
     * Converts modification count to a risk score contribution (0-25).
     */
    private int scoreFromCount(int count) {
        if (count >= threshold * 3) return 25; // 3x threshold = maximum score
        if (count >= threshold * 2) return 20;
        if (count >= threshold)     return 15;
        if (count >= threshold / 2) return 8;
        return 0;
    }

    public int getThreshold() { return threshold; }
    public long getWindowSeconds() { return windowSeconds; }
}
