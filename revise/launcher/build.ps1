# Compile Revise.exe : un exécutable unique qui embarque le dossier app\ (aucun outil à installer :
# on utilise le compilateur C# fourni avec Windows). À relancer après toute modification de app\.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$csc = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$obj = Join-Path $here 'obj'
New-Item -ItemType Directory -Force $obj | Out-Null

# 1. icône
& $csc /nologo /out:"$obj\IconGen.exe" /r:System.Drawing.dll "$here\IconGen.cs"
if ($LASTEXITCODE) { throw 'IconGen : échec de compilation' }
& "$obj\IconGen.exe" "$obj\icon.ico"

# 2. archive de l'application web
$zip = Join-Path $obj 'app.zip'
if (Test-Path $zip) { Remove-Item $zip }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory((Join-Path $root 'app'), $zip, 'Optimal', $false)
Set-Content -Path "$obj\build.txt" -Value (Get-Date -Format 'yyyyMMddHHmmss') -Encoding ascii

# 3. exécutable
$lib = Join-Path $here 'lib'
& $csc /nologo /target:winexe /platform:x64 /optimize+ /out:"$root\Revise.exe" `
  /win32icon:"$obj\icon.ico" /win32manifest:"$here\app.manifest" `
  /r:System.Windows.Forms.dll /r:System.Drawing.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll `
  /r:"$lib\Microsoft.Web.WebView2.Core.dll" /r:"$lib\Microsoft.Web.WebView2.WinForms.dll" `
  /resource:"$zip",app.zip /resource:"$obj\build.txt",build.txt `
  /resource:"$lib\Microsoft.Web.WebView2.Core.dll",Microsoft.Web.WebView2.Core.dll `
  /resource:"$lib\Microsoft.Web.WebView2.WinForms.dll",Microsoft.Web.WebView2.WinForms.dll `
  /resource:"$lib\WebView2Loader.dll",WebView2Loader.dll `
  "$here\Program.cs"
if ($LASTEXITCODE) { throw 'Revise.exe : échec de compilation' }
$f = Get-Item "$root\Revise.exe"
"OK : $($f.FullName) ($([math]::Round($f.Length / 1MB, 2)) Mo)"
