param([ValidateRange(1024, 65535)][int]$Puerto = 3000)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

foreach ($archivo in @('entrega/base/01-esquema.sql', 'entrega/base/02-contenido.sql', 'entrega/base/03-restricciones.sql', 'entrega/multimedia.tar.gz.part0000')) {
    if (!(Test-Path -LiteralPath $archivo -PathType Leaf)) {
        throw "Falta $archivo. Descarga el repositorio privado completo de la entrega."
    }
}

docker info --format '{{.ServerVersion}}'
if ($LASTEXITCODE) { throw 'Abre Docker Desktop y espera a que el motor Linux esté listo.' }

function Nueva-Clave {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
}

if (!(Test-Path -LiteralPath '.env.entrega')) {
    $admin = Nueva-Clave
    $programador = Nueva-Clave
    @(
        'POSTGRES_DB=cinemateca'
        'POSTGRES_USER=cinemateca'
        "POSTGRES_PASSWORD=$(Nueva-Clave)"
        "JWT_SECRET=$(Nueva-Clave)"
        "STREAM_SECRET=$(Nueva-Clave)"
        "TICKET_SECRET=$(Nueva-Clave)"
        'ADMIN_EMAIL=admin-entrega@cinemateca.local'
        "ADMIN_PASSWORD=$admin"
        'PROGRAMMER_EMAIL=programador-entrega@cinemateca.local'
        "PROGRAMMER_PASSWORD=$programador"
        'COOKIE_SECURE=false'
        'PAYMENT_MODE=simulation'
        'ALLOW_LAN_ACCESS=false'
    ) | Set-Content -LiteralPath '.env.entrega' -Encoding Ascii
}

$env:FRONTEND_PORT = "$Puerto"
$env:APP_ORIGIN = "http://localhost:$Puerto"
docker compose --env-file .env.entrega -f compose.yaml -f compose.entrega.yaml -p cinemateca-entrega up -d --build
if ($LASTEXITCODE) { throw 'Docker Compose no pudo iniciar la entrega.' }
Write-Host "Abre http://localhost:$Puerto. Las cuentas propias de esta instalación están en .env.entrega."
