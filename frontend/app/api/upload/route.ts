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
    // Cloud name can come from the server-only var or the public one used by the
    // original unsigned-upload setup — accept either so existing config keeps working.
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // Signed uploads (preferred) need the API key + secret. If those aren't
    // available, fall back to an unsigned upload preset. We need a cloud name
    // plus at least one of those two mechanisms to proceed.
    const canSign = Boolean(cloudName && apiKey && apiSecret);
    const canUnsigned = Boolean(cloudName && uploadPreset);

    if (!canSign && !canUnsigned) {
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

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "vetworld/uploads";

    // ── Unsigned upload: hand the client the preset; Cloudinary validates it. ──
    if (!canSign) {
        return NextResponse.json({
            uploadUrl,
            params: {
                upload_preset: uploadPreset,
                folder,
            },
        });
    }

    // ── Signed upload: sign the request server-side so secrets never reach the client. ──
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
    });

    const timestamp = Math.floor(Date.now() / 1000);
    const signedParams = {
        allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
        folder,
        timestamp,
    };
    const signature = cloudinary.utils.api_sign_request(signedParams, apiSecret!);

    return NextResponse.json({
        uploadUrl,
        params: {
            api_key: apiKey,
            allowed_formats: CLOUDINARY_ALLOWED_FORMATS,
            folder,
            signature,
            timestamp,
        },
    });
}
