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
