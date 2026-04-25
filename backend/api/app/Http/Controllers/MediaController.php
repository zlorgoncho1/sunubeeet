<?php
namespace App\Http\Controllers;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
class MediaController extends Controller {
    
     public function __call($m, $a) {
        return response()->json(['message' => 'Not implemented'], 501);
    }
 }
