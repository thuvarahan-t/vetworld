import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
]);
const CLOUDINARY_ALLOWED_FORMATS = "jpg,jpeg,png,webp,gif,pdf";

type UploadRequest = {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
};

export async function POST(request: Request) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return NextResponse.json({ error: "Upload service is not configured." }, { status: 500 });
    }

    let body: UploadRequest;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const fileType = body.fileType?.trim().toLowerCase();
    const fileSize = body.fileSize;

    if (!fileType || !ALLOWED_FILE_TYPES.has(fileType)) {
        return NextResponse.json({ error: "Only JPG, PNG, WEBP, GIF, and PDF files are allowed." }, { status: 400 });
    }

    if (typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "File must be 5MB or smaller." }, { status: 400 });
    }

    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "vetworld/uploads";
    const signedParams = {
        allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
        folder,
        timestamp,
    };
    const signature = cloudinary.utils.api_sign_request(signedParams, apiSecret);

    return NextResponse.json({
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        params: {
            api_key: apiKey,
            allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
            folder,
            signature,
            timestamp,
        },
    });
}
