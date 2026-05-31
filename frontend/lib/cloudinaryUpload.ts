const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
]);

type SignedUploadResponse = {
    uploadUrl: string;
    params: Record<string, string | number>;
};

type CloudinaryUploadResponse = {
    secure_url?: string;
    error?: {
        message?: string;
    };
};

export function validateUploadFile(file: File): string | null {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
        return "Please upload a JPG, PNG, WEBP, GIF, or PDF file.";
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return "File must be 5MB or smaller.";
    }

    return null;
}

export async function uploadSignedFile(file: File): Promise<string> {
    const validationError = validateUploadFile(file);
    if (validationError) {
        throw new Error(validationError);
    }

    const signatureResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
        }),
    });

    const signedUpload = await signatureResponse.json();
    if (!signatureResponse.ok) {
        throw new Error(signedUpload.error || "Could not prepare upload.");
    }

    const { uploadUrl, params } = signedUpload as SignedUploadResponse;
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(params).forEach(([key, value]) => {
        formData.append(key, String(value));
    });

    const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
    });
    const uploadData = (await uploadResponse.json()) as CloudinaryUploadResponse;

    if (!uploadResponse.ok || !uploadData.secure_url) {
        throw new Error(uploadData.error?.message || "Upload failed.");
    }

    return uploadData.secure_url;
}
