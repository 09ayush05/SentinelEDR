package com.sentineledr.agent.monitor;

import com.sentineledr.agent.config.AgentConfig;
import com.sentineledr.agent.entropy.EntropyCalculator;
import com.sentineledr.agent.model.FileEvent;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

public class FileMonitor implements Runnable {

    private final AgentConfig config;
    private final EntropyCalculator entropyCalc;
    private final Consumer<FileEvent> eventConsumer;
    private WatchService watchService;
    private volatile boolean running = false;
    private final Map<WatchKey, Path> watchKeyMap = new HashMap<>();
    private final ConcurrentHashMap<String, Double> entropyCache = new ConcurrentHashMap<>();

    public FileMonitor(AgentConfig config, EntropyCalculator entropyCalc,
                       Consumer<FileEvent> eventConsumer) {
        this.config = config;
        this.entropyCalc = entropyCalc;
        this.eventConsumer = eventConsumer;
    }

    public void start() {
        Thread thread = new Thread(this, "FileMonitor");
        thread.setDaemon(true);
        thread.start();
        running = true;
        System.out.println("[FileMonitor] Started monitoring " + config.getWatchPaths().size() + " path(s)");
    }

    public void stop() {
        running = false;
        try {
            if (watchService != null) watchService.close();
        } catch (IOException e) {
            System.err.println("[FileMonitor] Error closing watch service: " + e.getMessage());
        }
    }

    @Override
    public void run() {
        try {
            watchService = FileSystems.getDefault().newWatchService();
            registerWatchPaths();
            pollEvents();
        } catch (IOException e) {
            System.err.println("[FileMonitor] Fatal error: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void registerWatchPaths() throws IOException {
        List<String> paths = config.getWatchPaths();
        for (String pathStr : paths) {
            Path path = Paths.get(pathStr.trim());
            if (!Files.exists(path)) {
                System.out.println("[FileMonitor] Watch path does not exist, skipping: " + path);
                continue;
            }
            registerRecursively(path);
            System.out.println("[FileMonitor] Watching: " + path);
        }
    }

    private void registerRecursively(Path root) throws IOException {
        Files.walkFileTree(root,
            new HashSet<>(Arrays.asList(FileVisitOption.FOLLOW_LINKS)),
            Integer.MAX_VALUE,
            new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs)
                        throws IOException {
                    if (attrs.isSymbolicLink()) {
                        return FileVisitResult.SKIP_SUBTREE;
                    }
                    try {
                        registerDirectory(dir);
                    } catch (IOException e) {
                        System.out.println("[FileMonitor] Skipping inaccessible directory: " + dir);
                    }
                    return FileVisitResult.CONTINUE;
                }

                @Override
                public FileVisitResult visitFileFailed(Path file, IOException exc) {
                    System.out.println("[FileMonitor] Cannot access, skipping: " + file);
                    return FileVisitResult.CONTINUE;
                }
            });
    }

    private void registerDirectory(Path dir) throws IOException {
        WatchKey key = dir.register(watchService,
            StandardWatchEventKinds.ENTRY_CREATE,
            StandardWatchEventKinds.ENTRY_MODIFY,
            StandardWatchEventKinds.ENTRY_DELETE
        );
        watchKeyMap.put(key, dir);
    }

    private void pollEvents() throws InterruptedException, IOException {
        while (running) {
            WatchKey key = watchService.take();
            Path dir = watchKeyMap.get(key);
            if (dir == null) {
                key.reset();
                continue;
            }
            for (WatchEvent<?> event : key.pollEvents()) {
                processEvent(dir, event);
            }
            boolean valid = key.reset();
            if (!valid) {
                watchKeyMap.remove(key);
                System.out.println("[FileMonitor] Directory no longer accessible: " + dir);
            }
        }
    }

    @SuppressWarnings("unchecked")
    private void processEvent(Path dir, WatchEvent<?> event) throws IOException {
        WatchEvent.Kind<?> kind = event.kind();
        if (kind == StandardWatchEventKinds.OVERFLOW) {
            System.out.println("[FileMonitor] WARNING: Event overflow - some events lost");
            return;
        }
        WatchEvent<Path> pathEvent = (WatchEvent<Path>) event;
        Path fileName = pathEvent.context();
        Path fullPath = dir.resolve(fileName);
        String absolutePath = fullPath.toAbsolutePath().toString();

        FileEvent.EventType eventType;
        if (kind == StandardWatchEventKinds.ENTRY_CREATE) {
            eventType = FileEvent.EventType.CREATED;
            cacheEntropy(absolutePath);
        } else if (kind == StandardWatchEventKinds.ENTRY_MODIFY) {
            eventType = FileEvent.EventType.MODIFIED;
        } else if (kind == StandardWatchEventKinds.ENTRY_DELETE) {
            eventType = FileEvent.EventType.DELETED;
            entropyCache.remove(absolutePath);
        } else {
            return;
        }

        FileEvent fileEvent = new FileEvent(config.getEndpointId(), eventType, absolutePath);

        if (eventType == FileEvent.EventType.MODIFIED) {
            Double cachedEntropy = entropyCache.get(absolutePath);
            if (cachedEntropy != null) {
                fileEvent.setEntropyBefore(cachedEntropy);
            }
            double currentEntropy = entropyCalc.calculate(absolutePath);
            fileEvent.setEntropyAfter(currentEntropy);
            if (currentEntropy >= 0) {
                entropyCache.put(absolutePath, currentEntropy);
            }
        }

        try {
            if (Files.exists(fullPath)) {
                fileEvent.setFileSizeBytes(Files.size(fullPath));
            }
        } catch (IOException e) {
            // File may have been deleted between event and size check
        }

        eventConsumer.accept(fileEvent);
    }

    private void cacheEntropy(String filePath) {
        double entropy = entropyCalc.calculate(filePath);
        if (entropy >= 0) {
            entropyCache.put(filePath, entropy);
        }
    }
}
