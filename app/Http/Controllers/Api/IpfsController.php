<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class IpfsController extends Controller
{
    private function getPinataJwt(): ?string
    {
        return config('services.pinata.jwt') ?: env('PINATA_JWT');
    }

    private function getGatewayPrefix(): string
    {
        return rtrim(env('IPFS_PUBLIC_GATEWAY', 'https://gateway.pinata.cloud/ipfs/'), '/') . '/';
    }

    public function uploadAsset(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:20480',
            'name' => 'nullable|string|max:120',
        ]);

        $jwt = $this->getPinataJwt();
        if (!$jwt) {
            return response()->json([
                'success' => false,
                'message' => 'PINATA_JWT belum diatur di environment',
            ], 500);
        }

        $file = $request->file('file');
        $displayName = $request->input('name', $file->getClientOriginalName());

        $response = Http::withToken($jwt)
            ->attach('file', fopen($file->getRealPath(), 'r'), $displayName)
            ->post('https://api.pinata.cloud/pinning/pinFileToIPFS', [
                'pinataMetadata' => json_encode([
                    'name' => $displayName,
                ]),
            ]);

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Upload file ke Pinata gagal',
                'details' => $response->json(),
            ], 502);
        }

        $json = $response->json();
        $cid = $json['IpfsHash'] ?? null;

        return response()->json([
            'success' => true,
            'cid' => $cid,
            'ipfs_uri' => $cid ? "ipfs://{$cid}" : null,
            'gateway_url' => $cid ? $this->getGatewayPrefix() . $cid : null,
            'pinata' => $json,
        ]);
    }

    public function uploadMetadata(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'image_cid' => 'required|string|max:255',
            'attributes' => 'nullable|array',
        ]);

        $jwt = $this->getPinataJwt();
        if (!$jwt) {
            return response()->json([
                'success' => false,
                'message' => 'PINATA_JWT belum diatur di environment',
            ], 500);
        }

        $imageCid = $request->input('image_cid');
        $metadata = [
            'name' => $request->input('name'),
            'description' => $request->input('description', ''),
            'image' => "ipfs://{$imageCid}",
            'attributes' => $request->input('attributes', []),
        ];

        $response = Http::withToken($jwt)
            ->post('https://api.pinata.cloud/pinning/pinJSONToIPFS', [
                'pinataContent' => $metadata,
                'pinataMetadata' => [
                    'name' => $request->input('name') . '-metadata',
                ],
            ]);

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Upload metadata ke Pinata gagal',
                'details' => $response->json(),
            ], 502);
        }

        $json = $response->json();
        $cid = $json['IpfsHash'] ?? null;

        return response()->json([
            'success' => true,
            'cid' => $cid,
            'ipfs_uri' => $cid ? "ipfs://{$cid}" : null,
            'gateway_url' => $cid ? $this->getGatewayPrefix() . $cid : null,
            'metadata' => $metadata,
            'pinata' => $json,
        ]);
    }
}
