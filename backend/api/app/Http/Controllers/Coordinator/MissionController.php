<?php
namespace App\Http\Controllers\Coordinator;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
class MissionController extends Controller { public function __call($m, $a) { return response()->json(['message' => 'Not implemented'], 501); } }
