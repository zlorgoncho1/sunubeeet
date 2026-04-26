<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ValidateAlerteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => 'required|in:create_new_incident,attach_to_existing',
            'incident_data' => 'required_if:action,create_new_incident|array',
            'incident_data.title' => 'required_if:action,create_new_incident|string|max:255',
            'incident_data.severity' => 'required_if:action,create_new_incident|in:low,medium,high,critical',
            'incident_data.priority' => 'nullable|in:p1,p2,p3,p4',
            'incident_id' => 'required_if:action,attach_to_existing|exists:incidents,id',
        ];
    }
}
