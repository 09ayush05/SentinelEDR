const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface ApiSuccess<T> {
    success: true;
    data: T;
}

interface ApiFailure {
    success: false;
    error: { message: string };
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/**
 * Wraps fetch() against the SentinelEDR backend.
 * Automatically attaches the JWT (if present) and unwraps the
 * { success, data } / { success: false, error: { message } } envelope
 * used by authController.js and friends.
 */
export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("sentineledr_token") : null;

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    let json: ApiResponse<T>;
    try {
        json = await res.json();
    } catch {
        throw new Error(`Server returned an unexpected response (status ${res.status})`);
    }

    if (!json.success) {
        throw new Error(json.error.message || "Request failed");
    }

    return json.data;
}