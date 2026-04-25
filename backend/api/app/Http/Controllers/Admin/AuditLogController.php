<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
class AuditLogController extends Controller { public function __call($m, $a) { return response()->json(['message' => 'Not implemented'], 501); } }
