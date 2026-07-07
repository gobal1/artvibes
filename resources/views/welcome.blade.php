<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>NFT Marketplace</title>
    
    <script>
        // Suntikan data user dari Laravel ke JavaScript
        window.user = {!! Auth::check() ? json_encode(Auth::user()) : 'null' !!};
    </script>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="m-0 p-0 bg-slate-950">
    <div id="app"></div>
</body>
</html>