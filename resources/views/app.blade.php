<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        @viteReactRefresh
        @vite('resources/js/app.jsx')
        @inertiaHead
    </head>
    <body>
        <script>
            // Inject authenticated user data for React app
            window.user = {!! Auth::check() ? json_encode(Auth::user()) : 'null' !!};
        </script>
        @inertia
    </body>
</html>