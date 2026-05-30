const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type PdfDocument = {
  id: string;
  title: string;
  originalName: string;
  size: number;
  status: "uploaded" | "processing" | "indexed" | "failed";
  pageCount: number;
  chunkCount: number;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
};

export type Citation = {
  documentId: string;
  title: string;
  chunkIndex: number;
  score: number;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  createdAt?: string;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

async function request<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data as T;
}

export const authApi = {
  signup(payload: { name: string; email: string; password: string }) {
    return request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  me(token: string) {
    return request<{ user: AuthUser }>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};

export const documentApi = {
  list(token: string) {
    return request<{ documents: PdfDocument[] }>("/documents", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },
  upload(token: string, file: File, onProgress: (progress: number) => void) {
    const formData = new FormData();
    formData.append("file", file);

    return new Promise<{ document: PdfDocument }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/documents`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        const data = JSON.parse(xhr.responseText || "{}");

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
          return;
        }

        reject(new Error(data.message ?? "Upload failed"));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(formData);
    });
  },
  remove(token: string, documentId: string) {
    return request<void>(`/documents/${documentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};

export const chatApi = {
  listSessions(token: string) {
    return request<{ sessions: ChatSession[] }>("/chat/sessions", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },
  async streamAnswer({
    token,
    sessionId,
    question,
    onSession,
    onCitations,
    onToken
  }: {
    token: string;
    sessionId?: string;
    question: string;
    onSession: (session: { sessionId: string; title: string }) => void;
    onCitations: (citations: Citation[]) => void;
    onToken: (token: string) => void;
  }) {
    const response = await fetch(`${API_URL}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ sessionId, question })
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message ?? "Chat request failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        const eventName = eventText.match(/^event: (.+)$/m)?.[1];
        const dataText = eventText.match(/^data: (.+)$/m)?.[1];

        if (!eventName || !dataText) {
          continue;
        }

        const data = JSON.parse(dataText);

        if (eventName === "session") {
          onSession(data);
        }

        if (eventName === "citations") {
          onCitations(data.citations);
        }

        if (eventName === "token") {
          onToken(data.token);
        }
      }
    }
  }
};
