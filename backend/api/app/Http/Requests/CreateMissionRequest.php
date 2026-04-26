<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateMissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'incident_id' => 'required|exists:incidents,id',
            'assigned_to_user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'briefing' => 'nullable|string|max:1000',
            'estimated_duration_minutes' => 'nullable|integer|min:1|max:1440',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'service_info_site_ids' => 'nullable|array',
            'service_info_site_ids.*' => 'exists:sites,id',
            'send_immediately' => 'boolean',
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([
            'send_immediately' => $this->boolean('send_immediately', false),
        ]);
    }
}
