$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Compose {
    docker compose -p cinemateca @args
    if ($LASTEXITCODE) { throw "Falló Docker Compose al ejecutar $($args[0])." }
}

$salida = Join-Path (Get-Location).Path 'entrega'
if (Test-Path -LiteralPath $salida) { throw 'Ya existe entrega. Mueve esa carpeta antes de generar una nueva.' }
Invoke-Compose exec -T db pg_isready
New-Item -ItemType Directory -Path (Join-Path $salida 'base') -Force | Out-Null

try {
    Invoke-Compose stop frontend backend worker reservas-worker
    $exportar = @'
dump() {
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges "$@"
}
dump --section=pre-data -f /tmp/01-esquema.sql
dump --data-only -f /tmp/02-contenido.sql \
    -t roles -t obras -t generos -t obras_generos -t personas -t obras_personas \
    -t videos -t lsc_videos -t subtitulos -t salas -t funciones -t asientos -t cursos -t modulos \
    -t eventos -t aulas -t rutas_cnrod -t documentos_legales -t equipo_miembros -t '*_id_seq'
dump --section=post-data -f /tmp/03-restricciones.sql
# fin
'@
    ($exportar -replace "`r","") | docker compose -p cinemateca exec -T db sh -e
    if ($LASTEXITCODE) { throw 'Falló la exportación de PostgreSQL.' }
    foreach ($nombre in @('01-esquema.sql', '02-contenido.sql', '03-restricciones.sql')) {
        Invoke-Compose cp "db:/tmp/$nombre" (Join-Path $salida "base/$nombre")
    }
    $archivar = @'
cd /data
set --
for directorio in originals hls posters subtitulos legal; do
    if [ -d "$directorio" ]; then set -- "$@" "$directorio"; fi
done
test "$#" -gt 0
tar -czf /salida/multimedia.tar.gz "$@"
tar -tzf /salida/multimedia.tar.gz >/dev/null
# fin
'@
    ($archivar -replace "`r","") | docker compose -p cinemateca run --rm --no-deps -T -v "${salida}:/salida" --entrypoint sh storage-init -e
    if ($LASTEXITCODE) { throw 'Falló la exportación multimedia.' }
} finally {
    Invoke-Compose up -d
}

& (Join-Path $PSScriptRoot 'dividir-multimedia-entrega.ps1')
$grandes = Get-ChildItem -LiteralPath (Join-Path $salida 'base') -File | Where-Object Length -ge 100MB
if ($grandes) { throw 'La entrega contiene archivos de 100 MiB o más. Configura Git LFS antes de añadirlos y prueba un clon limpio.' }
Write-Host 'Entrega preparada. Prueba el arranque en una instalación limpia antes de subirla.'
