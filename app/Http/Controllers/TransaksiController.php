<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Auth;

class TransaksiController extends Controller
{
    public function myPurchases(Request $request)
    {
        $userId = $request->input('buyer_id')
            ?? $request->user()?->idUser
            ?? $request->user()?->id
            ?? Auth::id();

        if (!$userId) {
            return response()->json([], 200);
        }

        $transactions = Transaksi::where('buyer_id', $userId)
            ->orderByDesc('idtransaksi')
            ->with(['produk' => function ($query) {
                $query->with([
                    'user:idUser,name,email,avatar,bio,profile_background',
                    'kategori:idkategori,name',
                    'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk',
                ]);
            }])
            ->get();

        $products = $transactions
            ->map(function ($tx) {
                $produk = $tx->produk;
                if (!$produk) {
                    return null;
                }

                $productArray = $produk->toArray();
                $productArray['transaction_id'] = $tx->idtransaksi;
                $productArray['transaction_amount'] = (float) $tx->amount;
                $productArray['transaction_status'] = $tx->status;
                $productArray['transaction_sequence'] = $tx->idtransaksi;
                $productArray['purchased_at'] = $tx->created_at ?? null;
                $productArray['buyer_id'] = $tx->buyer_id;

                return $productArray;
            })
            ->filter()
            ->filter(fn ($produk) => (int) ($produk['user_idUser'] ?? 0) === (int) $userId)
            ->unique(fn ($produk) => $produk['idproduk'] ?? null)
            ->values();

        return response()->json($products, 200);
    }

    public function financeAnalytics(Request $request)
    {
        $userId = $request->user()?->idUser
            ?? $request->user()?->id
            ?? Auth::id();

        $transactions = Transaksi::with([
            'produk' => function ($query) {
                $query->with('user:idUser,name,email,avatar,bio,profile_background');
            },
            'buyer:idUser,name,email',
        ])
            ->orderByDesc('idtransaksi')
            ->get();

        $payload = [
            'user_id' => $userId,
            'rows' => $transactions->map(function ($tx) {
                return [
                    'transaction_id' => (int) $tx->idtransaksi,
                    'amount' => (float) $tx->amount,
                    'status' => $tx->status,
                    'buyer_id' => (int) ($tx->buyer_id ?? 0),
                    'buyer_name' => $tx->buyer?->name ?? 'Unknown Buyer',
                    'product_id' => (int) ($tx->produk?->idproduk ?? 0),
                    'product_title' => $tx->produk?->title ?? 'Untitled Asset',
                    'product_status' => $tx->produk?->status ?? 'unknown',
                    'product_owner_id' => (int) ($tx->produk?->user_idUser ?? 0),
                    'product_owner_name' => $tx->produk?->user?->name ?? 'Unknown Owner',
                    'created_at' => $tx->created_at ?? null,
                ];
            })->values()->all(),
        ];

        $analytics = $this->runPythonFinanceAnalytics($payload);

        return response()->json($analytics, 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'produk_id' => 'required|integer',
            'tx_hash' => 'required|string',
            'amount' => 'required',
        ]);

        $buyerId = $request->input('buyer_id', auth()->id());
        if (!$buyerId) {
            return response()->json([
                'success' => false,
                'message' => 'Pembeli belum terautentikasi.',
            ], 401);
        }

        $produk = Produk::find($request->produk_id);
        if (!$produk) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        try {
            // Jika tx_hash sudah tercatat, anggap transaksi sudah diproses (idempotent)
            $existing = DB::table('transaksi')->where('tx_hash', $request->tx_hash)->first();
            if ($existing) {
                $existingProduk = Produk::find($existing->produk_idproduk);
                if ($existingProduk) {
                    $existingProduk->load('user:idUser,name,email,avatar,bio,profile_background', 'kategori:idkategori,name', 'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk');
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Transaksi sudah tercatat sebelumnya.',
                    'produk' => $existingProduk ?? $produk,
                ], 200);
            }

            DB::beginTransaction();

            $sellerId = $produk->user_idUser;

            $produk->user_idUser = $buyerId;
            $produk->status = 'unlisted';
            $produk->save();

            $insertPayload = [
                'produk_idproduk' => $produk->idproduk,
                'buyer_id' => $buyerId,
                'tx_hash' => $request->tx_hash,
                'amount' => $request->amount,
                'status' => 'success',
            ];

            if (DB::getSchemaBuilder()->hasColumn('transaksi', 'seller_id')) {
                $insertPayload['seller_id'] = $sellerId;
            }

            if (DB::getSchemaBuilder()->hasColumn('transaksi', 'created_at')) {
                $insertPayload['created_at'] = now();
            }

            if (DB::getSchemaBuilder()->hasColumn('transaksi', 'updated_at')) {
                $insertPayload['updated_at'] = now();
            }

            DB::table('transaksi')->insert($insertPayload);

            $produk->load('user:idUser,name,email,avatar,bio,profile_background', 'kategori:idkategori,name', 'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembelian berhasil disimpan dan kepemilikan dipindahkan.',
                'produk' => $produk,
            ], 200);
        } catch (QueryException $e) {
            DB::rollBack();
            Log::error('Transaksi purchase DB error: ' . $e->getMessage());

            // Jika duplicate entry terjadi, tangani idempotent: kembalikan sukses
            if ($e->getCode() == '23000') {
                $existing = DB::table('transaksi')->where('tx_hash', $request->tx_hash)->first();
                $existingProduk = $existing ? Produk::find($existing->produk_idproduk) : null;
                if ($existingProduk) {
                    $existingProduk->load('user:idUser,name,email,avatar,bio,profile_background', 'kategori:idkategori,name', 'nft:idnfts,token_id,contract_address,metadata_url,produk_idproduk');
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Transaksi sudah tercatat (duplicate detected).',
                    'produk' => $existingProduk ?? $produk,
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal mencatat pembelian: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Transaksi purchase failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal mencatat pembelian: ' . $e->getMessage(),
            ], 500);
        }
    }

    protected function runPythonFinanceAnalytics(array $payload): array
    {
        $scriptPath = base_path('scripts/finance_analytics.py');

        if (!file_exists($scriptPath)) {
            return $this->fallbackFinanceAnalytics($payload);
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'artvibes-finance-');

        if ($tempFile === false) {
            return $this->fallbackFinanceAnalytics($payload);
        }

        file_put_contents($tempFile, json_encode($payload, JSON_PRETTY_PRINT));

        $command = PHP_OS_FAMILY === 'Windows'
            ? 'py -3 ' . escapeshellarg($scriptPath) . ' ' . escapeshellarg($tempFile)
            : 'python3 ' . escapeshellarg($scriptPath) . ' ' . escapeshellarg($tempFile);

        $descriptor = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = proc_open($command, $descriptor, $pipes, base_path());

        if (!is_resource($process)) {
            @unlink($tempFile);
            return $this->fallbackFinanceAnalytics($payload);
        }

        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);
        @unlink($tempFile);

        if ($exitCode !== 0) {
            Log::warning('finance_analytics.py failed', ['stderr' => $stderr, 'stdout' => $stdout]);
            return $this->fallbackFinanceAnalytics($payload);
        }

        $decoded = json_decode($stdout, true);
        if (!is_array($decoded)) {
            Log::warning('finance_analytics.py returned invalid JSON', ['stdout' => $stdout]);
            return $this->fallbackFinanceAnalytics($payload);
        }

        return $decoded;
    }

    protected function fallbackFinanceAnalytics(array $payload): array
    {
        $rows = collect($payload['rows'] ?? [])->filter(fn ($row) => ($row['status'] ?? null) === 'success')->values();
        $totalRevenue = $rows->sum(fn ($row) => (float) ($row['amount'] ?? 0));
        $totalSales = $rows->count();
        $avgPrice = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        $buckets = $rows
            ->values()
            ->take(12)
            ->reverse()
            ->values()
            ->map(function ($row, $index) {
                return [
                    'label' => 'Tx ' . ($index + 1),
                    'value' => (float) ($row['amount'] ?? 0),
                ];
            })
            ->all();

        $topBucketValue = collect($buckets)->max('value') ?? 0;

        return [
            'source' => 'php-fallback',
            'scope' => 'marketplace',
            'months' => $buckets,
            'smallStats' => [
                'totalRevenue' => round($totalRevenue, 3),
                'totalSales' => $totalSales,
                'avgPrice' => round($avgPrice, 3),
                'topMonthValue' => round($topBucketValue, 3),
                'activeBuyers' => $rows->pluck('buyer_id')->filter()->unique()->count(),
            ],
            'recent' => $rows->take(6)->map(function ($row) {
                return [
                    'id' => $row['transaction_id'] ?? uniqid('tx-', true),
                    'title' => $row['product_title'] ?? 'Untitled Asset',
                    'price' => (float) ($row['amount'] ?? 0),
                    'status' => $row['status'] ?? 'unknown',
                    'buyer_name' => $row['buyer_name'] ?? 'Unknown Buyer',
                ];
            })->values()->all(),
        ];
    }
}