#Requires -RunAsAdministrator
$ErrorActionPreference = 'Stop'
$carpetaProyecto = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $carpetaProyecto
try {
    docker version --format '{{.Server.Version}}'
    if ($LASTEXITCODE -ne 0) { throw 'Abre Docker Desktop y espera a que termine de iniciar.' }
    docker compose -p cinemateca up -d
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron iniciar los servicios. Revisa el error de Docker anterior.' }

    $nombreRegla = 'Cinemateca-Acceso-LAN-3000'
    $reglaExistente = Get-NetFirewallRule -Name $nombreRegla -ErrorAction SilentlyContinue
    if ($reglaExistente) {
        Set-NetFirewallRule -Name $nombreRegla -Enabled True -Direction Inbound -Action Allow -Profile Any | Out-Null
        $reglaExistente | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort 3000 | Out-Null
        $reglaExistente | Get-NetFirewallAddressFilter | Set-NetFirewallAddressFilter -RemoteAddress LocalSubnet | Out-Null
    } else {
        New-NetFirewallRule -Name $nombreRegla -DisplayName 'Cinemateca: acceso desde la red local' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -RemoteAddress LocalSubnet -Profile Any | Out-Null
    }

    $redesActivas = @(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address })
    if ($redesActivas.Count -eq 0) { throw 'No se encontro una conexion de red con direccion IPv4 y puerta de enlace.' }
    Write-Host ''
    Write-Host 'Computador: http://localhost:3000'
    foreach ($redActiva in $redesActivas) {
        foreach ($direccionActiva in $redActiva.IPv4Address) {
            $enlaceCelular = "http://$($direccionActiva.IPAddress):3000"
            try {
                $respuestaLocal = Invoke-WebRequest -Uri $enlaceCelular -UseBasicParsing -TimeoutSec 10
                Write-Host "Celular ($($redActiva.InterfaceAlias)): $enlaceCelular - HTTP $($respuestaLocal.StatusCode)"
            } catch { Write-Warning "No responde en $enlaceCelular. Revisa docker compose -p cinemateca ps." }
        }
    }
    Write-Host ''
    Write-Host 'Conecta el celular al mismo Wi-Fi y abre el enlace indicado.'
    Write-Host 'Si el PC abre el enlace pero el celular no, el router o un firewall adicional puede bloquear la comunicacion entre dispositivos.'
} finally { Pop-Location }
