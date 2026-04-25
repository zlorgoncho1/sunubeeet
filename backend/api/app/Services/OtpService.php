<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class OtpService
{
    private const TTL_MINUTES = 10;
    private const MAX_ATTEMPTS = 5;

    public function generate(string $phone): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        Cache::put(
            $this->cacheKey($phone),
            ['otp' => $otp, 'attempts' => 0],
            now()->addMinutes(self::TTL_MINUTES)
        );

        return $otp;
    }

    public function verify(string $phone, string $otp): bool
    {
        $data = Cache::get($this->cacheKey($phone));

        if (! $data) {
            return false;
        }

        if ($data['attempts'] >= self::MAX_ATTEMPTS) {
            Cache::forget($this->cacheKey($phone));
            return false;
        }

        if ($data['otp'] !== $otp) {
            Cache::put(
                $this->cacheKey($phone),
                ['otp' => $data['otp'], 'attempts' => $data['attempts'] + 1],
                now()->addMinutes(self::TTL_MINUTES)
            );
            return false;
        }

        Cache::forget($this->cacheKey($phone));
        return true;
    }

    public function send(string $phone, string $otp): void
    {
        // En production : intégrer Orange Money API, Twilio, etc.
        // Pour le dev : log uniquement
        Log::info("OTP pour {$phone} : {$otp}");
    }

    private function cacheKey(string $phone): string
    {
        return 'otp:' . hash('sha256', $phone);
    }
}
