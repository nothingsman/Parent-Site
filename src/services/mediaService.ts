import { apiClient } from '@/lib/apiClient';
import type {
  MediaFileResponse,
} from '@/types/api';
import type {
  MediaUploadInit,
  MediaUploadAbortResponse,
  MultipartCompleteResponse,
  MultipartPartUrl,
  MultipartUploadPart,
} from '@/types/message';

const MULTIPART_CHUNK_SIZE = 5 * 1024 * 1024;

type MediaEnvelope<T> = {
  data: T;
  message?: string;
};

function unwrapMediaResponse<T>(payload: MediaEnvelope<T> | T): T {
  return payload && typeof payload === 'object' && 'data' in payload
    ? payload.data
    : payload as T;
}

function normalizeEtag(etag: string | null): string {
  const trimmed = (etag ?? '').trim();
  if (!trimmed) return '';
  return /^".+"$/.test(trimmed) ? trimmed : `"${trimmed}"`;
}

export async function initMultipartUpload(file: File): Promise<MediaUploadInit> {
  const res = await apiClient.post<MediaEnvelope<MediaUploadInit> | MediaUploadInit>('/api/media/upload', {
    file_name: file.name,
    content_type: file.type || 'application/octet-stream',
  });
  return unwrapMediaResponse(res.data);
}

export async function getMultipartPartUrl(
  mediaId: string,
  uploadId: string,
  partNumber: number
): Promise<MultipartPartUrl> {
  const res = await apiClient.post<MediaEnvelope<MultipartPartUrl> | MultipartPartUrl>(
    `/api/media/${mediaId}/multipart/part-url`,
    { upload_id: uploadId, part_number: partNumber }
  );
  return unwrapMediaResponse(res.data);
}

export async function completeMultipartUpload(
  mediaId: string,
  uploadId: string,
  parts: MultipartUploadPart[]
): Promise<MultipartCompleteResponse> {
  const res = await apiClient.post<MediaEnvelope<MultipartCompleteResponse> | MultipartCompleteResponse>(
    `/api/media/${mediaId}/multipart/complete`,
    { upload_id: uploadId, parts }
  );
  return unwrapMediaResponse(res.data);
}

export async function abortMultipartUpload(
  mediaId: string,
  uploadId: string
): Promise<MediaUploadAbortResponse | null> {
  const res = await apiClient.post<MediaEnvelope<null> | MediaUploadAbortResponse>(
    `/api/media/${mediaId}/multipart/abort`,
    { upload_id: uploadId }
  );
  const payload = res.data;

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return {
      data: payload.data,
      message: payload.message ?? null,
    };
  }

  return payload as MediaUploadAbortResponse | null;
}

export async function getMediaFile(mediaId: string): Promise<MediaFileResponse> {
  const res = await apiClient.get<MediaEnvelope<MediaFileResponse> | MediaFileResponse>(
    `/api/media/${mediaId}`
  );
  const media = unwrapMediaResponse(res.data);

  if (media.download_url || media.status.toLowerCase() !== 'uploaded') {
    return media;
  }

  const downloadUrl = await getMediaDownloadUrl(mediaId).catch(() => null);
  return {
    ...media,
    download_url: downloadUrl,
  };
}

export async function getMediaDownloadUrl(mediaId: string): Promise<string | null> {
  const res = await apiClient.get<MediaEnvelope<{ download_url: string | null }> | { download_url: string | null }>(
    `/api/media/${mediaId}/url`
  );
  return unwrapMediaResponse(res.data).download_url ?? null;
}

export async function uploadFileToMedia(file: File): Promise<string> {
  const init = await initMultipartUpload(file);
  const parts: MultipartUploadPart[] = [];

  try {
    const partCount = Math.max(1, Math.ceil(file.size / MULTIPART_CHUNK_SIZE));

    for (let partNumber = 1; partNumber <= partCount; partNumber += 1) {
      const chunkStart = (partNumber - 1) * MULTIPART_CHUNK_SIZE;
      const chunkEnd = Math.min(chunkStart + MULTIPART_CHUNK_SIZE, file.size);
      const chunk = file.slice(chunkStart, chunkEnd);
      const part = await getMultipartPartUrl(init.id, init.upload_id, partNumber);
      const putResponse = await fetch(part.presigned_url, {
        method: 'PUT',
        body: chunk,
      });

      if (!putResponse.ok) {
        throw new Error('Failed to upload attachment.');
      }

      const etag = normalizeEtag(putResponse.headers.get('etag'));
      if (!etag) {
        throw new Error('Upload completed but attachment verification failed.');
      }

      parts.push({ part_number: partNumber, etag });
    }

    await completeMultipartUpload(init.id, init.upload_id, parts);
    return init.id;
  } catch (error) {
    await abortMultipartUpload(init.id, init.upload_id).catch(() => null);
    throw error;
  }
}
