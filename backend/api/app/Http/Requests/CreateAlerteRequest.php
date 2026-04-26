<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAlerteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Seuls les utilisateurs authentifiés peuvent créer des alertes
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'category' => [
                'required',
                'string',
                Rule::in(['health', 'security', 'crowd', 'access_blocked', 'fire_danger', 'lost_found', 'logistics', 'transport', 'other']),
            ],
            'sub_category' => [
                'nullable',
                'array',
            ],
            'sub_category.type' => [
                'nullable',
                'string',
                'max:100',
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'photo_media_id' => [
                'nullable',
                'uuid',
                'exists:media_files,id',
            ],
            'audio_media_id' => [
                'nullable',
                'uuid',
                'exists:media_files,id',
            ],
            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],
            'client_fingerprint' => [
                'nullable',
                'string',
                'max:128',
            ],
            'qr_token' => [
                'nullable',
                'string',
                // Validation du JWT QR token si fourni
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'category.required' => 'La catégorie est obligatoire.',
            'category.in' => 'Catégorie invalide.',
            'sub_category.array' => 'Le format de la sous-catégorie est invalide.',
            'description.max' => 'La description ne peut pas dépasser 1000 caractères.',
            'photo_media_id.exists' => 'Le fichier photo n\'existe pas.',
            'audio_media_id.exists' => 'Le fichier audio n\'existe pas.',
            'latitude.required' => 'La latitude est obligatoire.',
            'latitude.between' => 'Latitude invalide.',
            'longitude.required' => 'La longitude est obligatoire.',
            'longitude.between' => 'Longitude invalide.',
            'client_fingerprint.max' => 'Empreinte client trop longue.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'category' => 'catégorie',
            'sub_category' => 'sous-catégorie',
            'description' => 'description',
            'photo_media_id' => 'photo',
            'audio_media_id' => 'audio',
            'latitude' => 'latitude',
            'longitude' => 'longitude',
            'client_fingerprint' => 'empreinte client',
        ];
    }
}
