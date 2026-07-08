package com.sentineledr.agent.detector;

import java.util.Set;

public class SuspiciousExtensionDetector {

    private static final Set<String> RANSOMWARE_EXTENSIONS = Set.of(
        "locked", "encrypted", "crypto", "cerber", "locky",
        "zepto", "thor", "aesir", "zzzzz", "osiris", "odin",
        "shit", "wallet", "wcry", "wncry", "wncryt", "crypt",
        "crypted", "enc", "ezz", "exx", "vvv", "abc", "xyz",
        "aaa", "zzz", "micro", "ttt", "rdm", "r5a", "pays",
        "sage", "globe", "purge", "decrypt", "fun", "gdb",
        "hta", "kostya", "lol", "surprise"
    );

    private static final Set<String> RANSOM_NOTE_NAMES = Set.of(
        "readme_decrypt.txt", "how_to_decrypt.txt", "decrypt_instructions.txt",
        "how_to_recover_files.txt", "restore_files.txt", "recovery.txt",
        "readme.txt", "help_decrypt.html", "how_decrypt.html",
        "ransom.txt", "your_files_are_encrypted.txt", "attention.txt",
        "read_me.txt", "read_this.txt", "important.txt"
    );

    public boolean isSuspiciousExtension(String extension) {
        if (extension == null || extension.isEmpty()) return false;
        return RANSOMWARE_EXTENSIONS.contains(extension.toLowerCase());
    }

    public boolean isRansomNote(String fileName) {
        if (fileName == null || fileName.isEmpty()) return false;
        return RANSOM_NOTE_NAMES.contains(fileName.toLowerCase());
    }

    public int scoreExtensionChange(String oldExt, String newExt) {
        if (isSuspiciousExtension(newExt)) return 30;
        if (!oldExt.isEmpty() && !newExt.isEmpty() && !oldExt.equals(newExt)) return 10;
        return 0;
    }
}
