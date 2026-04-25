<?php
namespace App\Http\Controllers\Agent;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
class MapController extends Controller { public function __call($m, $a) { return response()->json(['message' => 'Not implemented'], 501); } }
