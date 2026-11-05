$ErrorActionPreference = 'Stop'
$carpeta = Join-Path (Split-Path -Parent $PSScriptRoot) 'entrega'
$archivo = Join-Path $carpeta 'multimedia.tar.gz'
$origen = [IO.File]::OpenRead($archivo)
try {
    $buffer = New-Object byte[] (1MB)
    $parte = 0
    while ($origen.Position -lt $origen.Length) {
        $ruta = Join-Path $carpeta ('multimedia.tar.gz.part{0:D4}' -f $parte)
        $destino = [IO.File]::Open($ruta, [IO.FileMode]::CreateNew)
        try {
            $restante = 45MB
            while ($restante -gt 0) {
                $leidos = $origen.Read($buffer, 0, [Math]::Min($buffer.Length, $restante))
                if (!$leidos) { break }
                $destino.Write($buffer, 0, $leidos)
                $restante -= $leidos
            }
        } finally { $destino.Dispose() }
        $parte++
    }
} finally { $origen.Dispose() }
