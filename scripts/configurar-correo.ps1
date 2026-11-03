$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectPath '.env'
if (-not (Test-Path -LiteralPath $envPath)) { throw 'No existe .env. Ejecuta primero la configuracion inicial del proyecto.' }

Write-Host 'Configuracion privada del correo de Cinemateca. No compartas la clave en el chat.'
$senderAddress = Read-Host 'Correo remitente (Enter: cinematecaboyaca.notificaciones@gmail.com)'
if ([string]::IsNullOrWhiteSpace($senderAddress)) { $senderAddress = 'cinematecaboyaca.notificaciones@gmail.com' }
if ($senderAddress -notmatch '^[a-zA-Z0-9._%+-]+@gmail\.com$') { throw 'Escribe la direccion completa de la cuenta Gmail del proyecto.' }
$appAddress = Read-Host 'Direccion para abrir los enlaces (Enter: http://localhost:3000)'
if ([string]::IsNullOrWhiteSpace($appAddress)) { $appAddress = 'http://localhost:3000' }
$parsedAddress = $null
if (-not [Uri]::TryCreate($appAddress, [UriKind]::Absolute, [ref]$parsedAddress) -or $parsedAddress.Scheme -notin @('http','https') -or $appAddress -match '[\r\n"#]') { throw 'Direccion de la aplicacion invalida.' }
Write-Host 'localhost sirve para abrir el enlace en este computador. Para otro dispositivo usa una direccion accesible desde ese dispositivo.'
$privatePassword = Read-Host 'Pega la CONTRASENA DE APLICACION de Google (entrada oculta)' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($privatePassword)
try {
    $mailPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer) -replace '\s',''
    if ($mailPassword -notmatch '^[a-zA-Z]{16}$') { throw 'Se espera la clave de aplicacion de Google de 16 letras, no la contrasena habitual.' }
    $envText = [IO.File]::ReadAllText($envPath)
    $settings = [ordered]@{
        MAIL_MODE = 'smtp'
        SMTP_HOST = 'smtp.gmail.com'
        SMTP_PORT = '587'
        SMTP_SECURE = 'false'
        SMTP_USER = $senderAddress
        SMTP_FROM = $senderAddress
        SMTP_PASSWORD = $mailPassword
        PUBLIC_APP_URL = $appAddress
    }
    foreach ($settingName in $settings.Keys) {
        $linePattern = '(?m)^' + [regex]::Escape($settingName) + '=.*\r?$'
        $settingLine = $settingName + '=' + $settings[$settingName]
        if ([regex]::IsMatch($envText, $linePattern)) {
            $envText = [regex]::Replace($envText, $linePattern, [Text.RegularExpressions.MatchEvaluator]{ param($matchedLine) $settingLine })
        } else { $envText = $envText.TrimEnd() + "`r`n" + $settingLine + "`r`n" }
    }
    [IO.File]::WriteAllText($envPath, $envText, [Text.UTF8Encoding]::new($false))
    Write-Host 'Configuracion guardada solo en .env. No se cambiaron cuentas ni datos de la base.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    $mailPassword = $null
    $envText = $null
    $settings = $null
    $privatePassword.Dispose()
}
Push-Location $projectPath
try {
    node scripts/verify-mail.mjs
    if ($LASTEXITCODE -ne 0) { throw 'La conexion SMTP no se pudo comprobar. Corrige la configuracion antes de continuar.' }
    Write-Host 'Ahora aplica la configuracion: docker compose -p cinemateca up -d --build frontend backend'
    Write-Host 'Despues prueba Olvide mi contrasena con tu cuenta personal. Revisa tambien Spam.'
} finally { Pop-Location }
