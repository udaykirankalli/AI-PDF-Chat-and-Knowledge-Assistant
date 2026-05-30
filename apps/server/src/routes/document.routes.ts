import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Router, type NextFunction, type Response } from "express";
import multer from "multer";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { Document } from "../models/document.model.js";

const uploadRoot = path.resolve(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await fs.mkdir(uploadRoot, { recursive: true });
      callback(null, uploadRoot);
    } catch (error) {
      callback(error as Error, uploadRoot);
    }
  },
  filename: (_req, file, callback) => {
    const safeBaseName = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/(^-|-$)/g, "")
      .toLowerCase();
    const uniqueName = `${Date.now()}-${randomUUID()}-${safeBaseName || "document"}.pdf`;
    callback(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new Error("Only PDF files are supported"));
      return;
    }

    callback(null, true);
  }
});

export const documentRouter = Router();

documentRouter.use(requireAuth);

documentRouter.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const documents = await Document.find({ userId: req.user!.id }).sort({ createdAt: -1 });

    res.json({
      documents: documents.map(toPublicDocument)
    });
  } catch (error) {
    next(error);
  }
});

documentRouter.post("/", handlePdfUpload, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "Please upload a PDF file" });
      return;
    }

    const document = await Document.create({
      userId: req.user!.id,
      title: path.basename(req.file.originalname, path.extname(req.file.originalname)),
      originalName: req.file.originalname,
      storedName: req.file.filename,
      storagePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: "uploaded"
    });

    res.status(201).json({
      document: toPublicDocument(document)
    });
  } catch (error) {
    next(error);
  }
});

documentRouter.delete("/:documentId", async (req: AuthenticatedRequest, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.documentId,
      userId: req.user!.id
    });

    if (!document) {
      res.status(404).json({ message: "Document not found" });
      return;
    }

    await Document.deleteOne({ _id: document._id });
    await fs.unlink(document.storagePath).catch(() => undefined);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

function handlePdfUpload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "PDF must be smaller than 15 MB" });
      return;
    }

    res.status(400).json({
      message: error instanceof Error ? error.message : "Upload failed"
    });
  });
}

function toPublicDocument(document: {
  _id: unknown;
  title: string;
  originalName: string;
  size: number;
  status: string;
  pageCount: number;
  chunkCount: number;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: String(document._id),
    title: document.title,
    originalName: document.originalName,
    size: document.size,
    status: document.status,
    pageCount: document.pageCount,
    chunkCount: document.chunkCount,
    errorMessage: document.errorMessage ?? "",
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}
