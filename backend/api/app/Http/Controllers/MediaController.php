<?php

namespace App\Http\Controllers;

use App\Models\MediaFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function uploadUrl(Request $request)
    {
        $data = $request->validate([
            'kind'       => ['required', 'string', 'in:photo,audio'],
            'mime_type'  => ['required', 'string'],
            'size_bytes' => ['required', 'integer', 'min:1', 'max:' . (5 * 1024 * 1024)],
        ]);

        $extension = $this->extensionFromMime($data['mime_type']);
        $objectKey = sprintf(
            'alertes/%s/%s/%s.%s',
            now()->format('Y/m/d'),
            $data['kind'],
            Str::uuid(),
            $extension
        );

        $presignedUrl = Storage::disk('s3')->temporaryUploadUrl(
            $objectKey,
            now()->addMinutes(15),
            ['ContentType' => $data['mime_type']]
        );

        $media = MediaFile::create([
            'kind'                   => $data['kind'],
            'bucket'                 => config('filesystems.disks.s3.bucket'),
            'object_key'             => $objectKey,
            'mime_type'              => $data['mime_type'],
            'size_bytes'             => $data['size_bytes'],
            'uploaded_by_user_id'    => auth('api')->id(),
            'blur_processing_status' => $data['kind'] === 'photo' ? 'pending' : 'ready',
            'transcription_status'   => 'not_requested',
            'checksum_sha256'        => 'pending',
        ]);

        return response()->json([
            'data' => [
                'media_id'   => $media->id,
                'upload_url' => $presignedUrl,
                'object_key' => $objectKey,
                'expires_in' => 900,
            ],
        ]);
    }

    public function finalize(Request $request, MediaFile $media)
    {
        $data = $request->validate([
            'checksum_sha256'  => ['required', 'string', 'size:64'],
            'duration_seconds' => ['nullable', 'integer', 'min:1', 'max:60'],
        ]);

        if (! Storage::disk('s3')->exists($media->object_key)) {
            return response()->json(['message' => 'Fichier introuvable sur le stockage.'], 422);
        }

        $media->update([
            'checksum_sha256'  => $data['checksum_sha256'],
            'duration_seconds' => $data['duration_seconds'] ?? null,
        ]);

        return response()->json([
            'data' => ['media_id' => $media->id, 'status' => 'finalized'],
        ]);
    }

    public function signedUrl(MediaFile $media)
    {
        $url = $media->getSignedUrl(5);

        return response()->json([
            'data' => ['url' => $url, 'expires_in' => 300],
        ]);
    }

    public function transcription(MediaFile $media)
    {
        // Vérifier que c'est un audio
        if ($media->kind !== 'audio') {
            return response()->json([
                'error' => [
                    'code' => 'INVALID_KIND',
                    'message' => 'Cette méthode est uniquement disponible pour les fichiers audio.',
                ]
            ], 400);
        }

        return response()->json([
            'data' => [
                'media_id' => $media->id,
                'transcription_status' => $media->transcription_status,
                'transcription_language' => $media->transcription_language,
                'transcription_original' => $media->transcription_original,
                'transcription_translated' => $media->transcription_translated,
                'transcription_translated_at' => $media->transcription_translated_at,
            ],
        ]);
    }

    private function extensionFromMime(string $mime): string
    {
        return match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'audio/webm' => 'webm',
            'audio/mpeg' => 'mp3',
            'audio/mp4'  => 'm4a',
            'audio/ogg'  => 'ogg',
            default      => 'bin',
        };
    }
}
