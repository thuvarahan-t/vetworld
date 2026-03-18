"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

interface ImageUploadProps {
    onUpload: (url: string) => void;
    value?: string;
    label?: string;
    compact?: boolean;
    enableGlobalPaste?: boolean;
}

export default function ImageUpload({
    onUpload,
    value,
    label = "Image",
    compact = false,
    enableGlobalPaste = true,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadToCloudinary = async (file: File) => {
        // Basic validation
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file");
            return;
        }

        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            setError("Image size should be less than 5MB");
            return;
        }

        try {
            setIsUploading(true);
            setError(null);

            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

            const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
            if (!cloudName) {
                throw new Error("Cloudinary configuration missing");
            }

            const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Upload failed");
            }

            const data = await response.json();
            onUpload(data.secure_url);
        } catch (err: any) {
            console.error("Upload error:", err);
            setError(err.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handlePasteItems = (items: DataTransferItemList | null | undefined) => {
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) {
                    uploadToCloudinary(file);
                    break;
                }
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadToCloudinary(file);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            uploadToCloudinary(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    // Global paste is useful for single image fields; disabled in repeating rows to avoid multi-upload collisions.
    useEffect(() => {
        if (!enableGlobalPaste) {
            return;
        }

        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
                if (target.getAttribute("type") !== "file") {
                    return;
                }
            }

            handlePasteItems(e.clipboardData?.items);
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, [enableGlobalPaste]);


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                {label}
            </label>

            {value ? (
                <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", minHeight: compact ? "96px" : "200px" }}>
                    <img src={value} alt="Uploaded preview" style={{ maxWidth: "100%", maxHeight: compact ? "120px" : "300px", objectFit: "contain" }} />

                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s ease" }}
                        onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={e => e.currentTarget.style.opacity = "0"}
                    >
                        <button
                            type="button"
                            onClick={() => onUpload("")}
                            style={{ background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            Remove Image
                        </button>
                    </div>
                </div>
            ) : (
                <motion.div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onPaste={(e) => {
                        e.preventDefault();
                        handlePasteItems(e.clipboardData?.items);
                    }}
                    tabIndex={0}
                    animate={{
                        borderColor: isDragOver ? "var(--vet-blue)" : "var(--border)",
                        backgroundColor: isDragOver ? "rgba(43, 89, 212, 0.05)" : "var(--bg)"
                    }}
                    style={{
                        border: "2px dashed",
                        borderRadius: "var(--radius-md)",
                        padding: compact ? "0.8rem" : "2rem",
                        textAlign: "center",
                        cursor: isUploading ? "wait" : "pointer",
                        position: "relative",
                        transition: "all 0.2s ease",
                        minHeight: compact ? "88px" : "150px",
                        outline: "none",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: compact ? "0.35rem" : "1rem"
                    }}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            opacity: 0,
                            cursor: isUploading ? "wait" : "pointer"
                        }}
                        id={`image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    />

                    {isUploading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                style={{ width: "32px", height: "32px", border: "3px solid rgba(43, 89, 212, 0.2)", borderTopColor: "var(--vet-blue)", borderRadius: "50%" }}
                            />
                            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500 }}>Uploading to Cloudinary...</span>
                        </div>
                    ) : (
                        <>
                            {!compact && (
                                <div style={{ color: "var(--text-secondary)", background: "rgba(0,0,0,0.05)", padding: "1rem", borderRadius: "50%", display: "inline-flex", marginBottom: "0.5rem" }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                        <polyline points="21 15 16 10 5 21" />
                                    </svg>
                                </div>
                            )}
                            <div>
                                <p style={{ margin: 0, fontWeight: 600, color: "var(--text-primary)", fontSize: compact ? "0.82rem" : "1rem" }}>
                                    Click / Drag / Paste image
                                </p>
                                <p style={{ margin: "0.2rem 0 0 0", color: "var(--text-secondary)", fontSize: compact ? "0.75rem" : "0.85rem" }}>
                                    <kbd style={{ padding: "0.1rem 0.4rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "monospace" }}>Ctrl+V</kbd> supported
                                </p>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    style={{ color: "rgb(239, 68, 68)", fontSize: "0.85rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    {error}
                </motion.div>
            )}
        </div>
    );
}
