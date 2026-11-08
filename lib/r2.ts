import "dotenv/config";
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID?.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
    bucket: process.env.R2_BUCKET_NAME?.trim(),
    publicUrl: process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, ""),
  };
}

function getClient(): S3Client | null {
  const { accountId, accessKeyId, secretAccessKey } = getR2Config();
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });
}

/**
 * رفع ملف إلى R2 وإرجاع الرابط العام (إن وُجد R2_PUBLIC_URL)
 */
export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<{ key: string; url: string | null }> {
  const { bucket, publicUrl } = getR2Config();
  const client = getClient();
  if (!client || !bucket) {
    throw new Error("R2 غير مضبوط: تأكد من R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME في .env");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = publicUrl ? `${publicUrl}/${key}` : null;
  return { key, url };
}

export function isR2Configured(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucket } = getR2Config();
  return !!(accountId && accessKeyId && secretAccessKey && bucket);
}

export async function signStudioUpload(key: string, contentType: string, size: number) {
  const client = getClient();
  const { bucket } = getR2Config();
  if (!client || !bucket) throw new Error("R2 storage is not configured");
  return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType, ContentLength: size }), { expiresIn: 900 });
}

export async function inspectStudioUpload(key: string) {
  const client = getClient();
  const { bucket } = getR2Config();
  if (!client || !bucket) throw new Error("R2 storage is not configured");
  return client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
}

export async function deleteStudioAudio(key: string) {
  const client = getClient();
  const { bucket } = getR2Config();
  if (!client || !bucket) throw new Error("R2 storage is not configured");
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function signStudioPlayback(key: string, contentType: string, downloadName?: string) {
  const client = getClient();
  const { bucket } = getR2Config();
  if (!client || !bucket) throw new Error("R2 storage is not configured");
  const disposition = downloadName
    ? `attachment; filename="recording"; filename*=UTF-8''${encodeURIComponent(downloadName).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)}`
    : undefined;
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentType: contentType, ResponseContentDisposition: disposition }), { expiresIn: 3600 });
}

export async function readR2File(key: string): Promise<Uint8Array> {
  const client = getClient();
  const { bucket } = getR2Config();
  if (!client || !bucket) throw new Error("R2 storage is not configured");
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) throw new Error("File not found");
  return result.Body.transformToByteArray();
}

/** يُرجع قائمة بأسماء المتغيرات الناقصة في .env */
export function getMissingR2EnvVars(): string[] {
  const { accountId, accessKeyId, secretAccessKey, bucket, publicUrl } = getR2Config();
  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucket) missing.push("R2_BUCKET_NAME");
  if (!publicUrl) missing.push("R2_PUBLIC_URL (لظهور رابط الصورة بعد الرفع)");
  return missing;
}
