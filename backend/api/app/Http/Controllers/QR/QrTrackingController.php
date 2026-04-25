<?php
namespace App\Http\Controllers\QR;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
class QrTrackingController extends Controller { public function __call($m, $a) { return response()->json(['message' => 'Not implemented'], 501); } }
