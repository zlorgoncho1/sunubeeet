<?php
namespace App\Http\Controllers\Spectator;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
class AlereteController extends Controller { public function __call($m, $a) { return response()->json(['message' => 'Not implemented'], 501); } }
