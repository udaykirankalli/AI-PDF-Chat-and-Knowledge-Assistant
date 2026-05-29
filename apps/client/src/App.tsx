import { ArrowUpRight, FileText, MessageSquareText, ShieldCheck } from "lucide-react";

const highlights = [
  {
    icon: ShieldCheck,
    label: "Secure workspace",
    text: "Authentication, document ownership, and private chat history are first-class parts of the build."
  },
  {
    icon: FileText,
    label: "Strict RAG pipeline",
    text: "Every answer will be generated from indexed chunks retrieved from the selected PDFs."
  },
  {
    icon: MessageSquareText,
    label: "Streaming chat",
    text: "Responses will feel live, with citations that point back to source document sections."
  }
];

export function App() {
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
          <button className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5">
            Open app
            <ArrowUpRight size={16} />
          </button>
        </header>

        <div className="grid flex-1 items-center gap-8 py-12 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-coral">
              Assessment build
            </p>
            <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Chat with PDFs through a real retrieval pipeline.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-700">
              This project is being built as a polished SaaS-style document assistant with auth, upload
              processing, semantic search, conversation history, and grounded AI answers.
            </p>
          </div>

          <div className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
            <div className="rounded-md bg-mist p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-semibold">Document chat preview</p>
                <span className="rounded-full bg-jade px-3 py-1 text-xs font-medium text-white">Indexed</span>
              </div>
              <div className="space-y-3">
                <div className="w-4/5 rounded-lg bg-white p-3 text-sm shadow-sm">
                  What does this document say about the admission timeline?
                </div>
                <div className="ml-auto w-5/6 rounded-lg bg-ink p-3 text-sm leading-6 text-white">
                  The retrieved sections mention a staged process: document review, interview scheduling,
                  and final confirmation. Citations will appear beside each answer once chat is wired in.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 pb-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article key={item.label} className="rounded-lg border border-black/10 bg-white p-4">
              <item.icon className="mb-4 text-jade" size={22} />
              <h3 className="font-semibold">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
