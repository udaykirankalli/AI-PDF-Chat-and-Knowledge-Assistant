import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  Trash2,
  Upload
} from "lucide-react";
import { authApi, documentApi, type AuthUser, type PdfDocument } from "./lib/api";
import { clearSession, readSession, saveSession } from "./lib/session";

type AuthMode = "login" | "signup";

const pipelineSteps = ["Upload PDF", "Extract text", "Create embeddings", "Retrieve context", "Stream answer"];

export function App() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [user, setUser] = useState<AuthUser | null>(() => readSession()?.user ?? null);
  const [token, setToken] = useState(() => readSession()?.token ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<PdfDocument[]>([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  const title = mode === "signup" ? "Create your workspace" : "Welcome back";
  const submitLabel = mode === "signup" ? "Create account" : "Sign in";

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  useEffect(() => {
    if (!token) return;

    authApi.me(token).catch(() => {
      clearSession();
      setUser(null);
      setToken("");
    });
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;

    loadDocuments();
  }, [token, user]);

  useEffect(() => {
    if (!token || documents.every((document) => document.status !== "processing")) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadDocuments(false);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [documents, token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const response =
        mode === "signup"
          ? await authApi.signup({ name, email, password })
          : await authApi.login({ email, password });

      saveSession(response.token, response.user);
      setToken(response.token);
      setUser(response.user);
      setPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setToken("");
    setMode("login");
  }

  async function loadDocuments(showLoading = true) {
    if (!token) return;

    if (showLoading) {
      setIsDocumentsLoading(true);
    }

    try {
      const response = await documentApi.list(token);
      setDocuments(response.documents);
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Could not load documents");
    } finally {
      if (showLoading) {
        setIsDocumentsLoading(false);
      }
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !token) return;

    if (file.type !== "application/pdf") {
      setUploadMessage("Please choose a PDF file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage("");

    try {
      const response = await documentApi.upload(token, file, setUploadProgress);
      setDocuments((current) => [response.document, ...current]);
      setUploadMessage("PDF uploaded. Text extraction and vector indexing are running now.");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(documentId: string) {
    if (!token) return;

    const previousDocuments = documents;
    setDocuments((current) => current.filter((document) => document.id !== documentId));

    try {
      await documentApi.remove(token, documentId);
    } catch (error) {
      setDocuments(previousDocuments);
      setUploadMessage(error instanceof Error ? error.message : "Could not delete document");
    }
  }

  if (user) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] text-ink">
        <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-white">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-jade">PDF RAG Assistant</p>
                <h1 className="text-lg font-semibold">Knowledge workspace</h1>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium transition hover:bg-mist"
            >
              <LogOut size={16} />
              Logout
            </button>
          </header>

          <div className="grid flex-1 gap-5 py-8 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3 border-b border-black/10 pb-4">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-jade text-sm font-semibold text-white">
                  {initials}
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-neutral-600">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {["Documents", "Conversations", "Sources"].map((item) => (
                  <button
                    key={item}
                    className="flex h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium transition hover:bg-mist"
                  >
                    {item}
                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            </aside>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Documents</p>
                    <h2 className="mt-2 text-2xl font-semibold">Upload and manage PDFs</h2>
                  </div>
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5">
                    {isUploading ? <Loader2 className="animate-spin" size={17} /> : <Upload size={17} />}
                    Upload
                    <input className="sr-only" type="file" accept="application/pdf" onChange={handleUpload} disabled={isUploading} />
                  </label>
                </div>

                {isUploading && (
                  <div className="mb-4 rounded-lg border border-black/10 bg-[#fbfaf7] p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">Uploading PDF</span>
                      <span className="text-neutral-600">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-mist">
                      <div className="h-2 rounded-full bg-jade transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                {uploadMessage && (
                  <p className="mb-4 rounded-lg border border-black/10 bg-[#fbfaf7] px-3 py-2 text-sm text-neutral-700">
                    {uploadMessage}
                  </p>
                )}

                {isDocumentsLoading ? (
                  <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-black/20 bg-[#fbfaf7] p-6 text-center">
                    <Loader2 className="mb-4 animate-spin text-jade" size={34} />
                    <p className="font-medium">Loading your documents</p>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="grid min-h-[320px] place-items-center rounded-lg border border-dashed border-black/20 bg-[#fbfaf7] p-6 text-center">
                    <div className="max-w-md">
                      <FileText className="mx-auto mb-4 text-jade" size={36} />
                      <h3 className="text-lg font-semibold">No PDFs uploaded yet</h3>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        Upload a document to begin the RAG workflow. The next step will extract text,
                        chunk pages, and index embeddings in Qdrant.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((document) => (
                      <article
                        key={document.id}
                        className="flex flex-col gap-4 rounded-lg border border-black/10 bg-[#fbfaf7] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <FileText className="shrink-0 text-jade" size={18} />
                            <h3 className="truncate font-semibold">{document.title}</h3>
                            <StatusBadge status={document.status} />
                          </div>
                          <p className="truncate text-sm text-neutral-600">{document.originalName}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatBytes(document.size)} · {document.pageCount} pages · {document.chunkCount} chunks
                          </p>
                          {document.errorMessage && (
                            <p className="mt-2 text-xs font-medium text-red-700">{document.errorMessage}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(document.id)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-black/10 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-red-200 hover:text-red-700"
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-black/10 bg-ink p-5 text-white shadow-soft">
                <MessageSquareText className="mb-4 text-coral" />
                <h2 className="text-xl font-semibold">RAG pipeline</h2>
                <div className="mt-5 space-y-3">
                  {pipelineSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-xs">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white/85">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-ink">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_430px]">
        <div>
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-white">
              <FileText size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-jade">PDF RAG Assistant</p>
              <h1 className="text-lg font-semibold">Knowledge workspace</h1>
            </div>
          </div>

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-coral">Assessment build</p>
          <h2 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            A secure place to upload PDFs and ask grounded questions.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-neutral-700">
            Authentication is the first production layer. From here, each PDF and conversation will stay tied
            to the signed-in user.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Feature icon={ShieldCheck} title="Private by design" text="JWT sessions and user-owned data shape every API." />
            <Feature icon={MessageSquareText} title="Built for chat" text="Conversation history will connect directly to retrieved sources." />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-jade">
                {mode === "signup" ? "Signup" : "Login"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
            </div>
            <LockKeyhole className="text-coral" />
          </div>

          <div className="mb-5 grid grid-cols-2 rounded-lg bg-mist p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-10 rounded-md text-sm font-medium transition ${mode === "signup" ? "bg-white shadow-sm" : "text-neutral-600"}`}
            >
              Signup
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`h-10 rounded-md text-sm font-medium transition ${mode === "login" ? "bg-white shadow-sm" : "text-neutral-600"}`}
            >
              Login
            </button>
          </div>

          <div className="space-y-4">
            {mode === "signup" && (
              <label className="block">
                <span className="text-sm font-medium">Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 h-11 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-jade"
                  placeholder="Your name"
                  required
                />
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-jade"
                placeholder="you@example.com"
                type="email"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-black/10 px-3 outline-none transition focus:border-jade"
                placeholder="At least 8 characters"
                type="password"
                minLength={mode === "signup" ? 8 : 1}
                required
              />
            </label>
          </div>

          {message && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {message}
            </p>
          )}

          <button
            disabled={isLoading}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={17} /> : <ArrowRight size={17} />}
            {submitLabel}
          </button>
        </form>
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: PdfDocument["status"] }) {
  const statusStyles = {
    uploaded: {
      icon: Clock3,
      label: "Uploaded",
      className: "bg-coral/15 text-coral"
    },
    processing: {
      icon: Loader2,
      label: "Processing",
      className: "bg-white/10 text-neutral-700"
    },
    indexed: {
      icon: CheckCircle2,
      label: "Indexed",
      className: "bg-jade/15 text-jade"
    },
    failed: {
      icon: AlertTriangle,
      label: "Failed",
      className: "bg-red-50 text-red-700"
    }
  };
  const item = statusStyles[status];
  const Icon = item.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${item.className}`}>
      <Icon size={13} className={status === "processing" ? "animate-spin" : ""} />
      {item.label}
    </span>
  );
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function Feature({
  icon: Icon,
  title,
  text
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <article className="rounded-lg border border-black/10 bg-white p-4">
      <Icon className="mb-4 text-jade" size={22} />
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
    </article>
  );
}
