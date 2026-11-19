# Second Brain Starter: Windows bootstrap. Review before running.
# Requires Windows 10/11, PowerShell and WinGet (App Installer).
[CmdletBinding()]
param(
  [Alias('Profile')][ValidateSet('personal','student','creator','professional','business','custom')][string]$BrainProfile = 'personal',
  [Alias('Destination')][string]$BrainDestination = '',
  [Alias('AI')][ValidateSet('none','codex','claude','gemini','all')][string]$BrainAI = '',
  [switch]$InstallTools,
  [switch]$Yes
)
$ErrorActionPreference = 'Stop'
$BrainArchive = 'https://github.com/ThausDesigner/second-brain-starter/archive/refs/tags/v1.0.0.tar.gz'
function Update-BrainPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') + ';' + $env:Path
}
Update-BrainPath
$BrainNode = Get-Command node -ErrorAction SilentlyContinue
$BrainNeedsNode = -not $BrainNode
if ($BrainNode) {
  $BrainMajor = [int]((& node --version).TrimStart('v').Split('.')[0])
  $BrainNeedsNode = $BrainMajor -lt 22
}
if ($BrainNeedsNode) {
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { throw 'Install WinGet / Microsoft App Installer from https://aka.ms/getwinget or install Node.js 22+ manually from https://nodejs.org/en/download and retry.' }
  Write-Host 'Installing Node.js LTS. Windows may request approval.'
  & winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-source-agreements --accept-package-agreements --disable-interactivity
  if ($LASTEXITCODE -ne 0) { throw 'Node.js installation failed. Install Node.js LTS manually, reopen PowerShell and retry.' }
  Update-BrainPath
}
if (-not (Get-Command node -ErrorAction SilentlyContinue) -or -not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) { throw 'Node.js/npm not in PATH. Reopen PowerShell and retry.' }
if ([int]((& node --version).TrimStart('v').Split('.')[0]) -lt 22) { throw 'Node.js 22+ required. Remove an older Node installation from PATH or update it.' }
$BrainArguments = @('--profile', $BrainProfile)
if ($BrainDestination) { $BrainArguments = @($BrainDestination) + $BrainArguments }
if ($BrainAI) { $BrainArguments += @('--ai', $BrainAI) }
if ($InstallTools) { $BrainArguments += '--install-tools' }
if ($Yes) { $BrainArguments += '--yes' }
Write-Host 'Starting the Second Brain setup wizard. Sign-ins are completed by you.'
& npx.cmd --yes "--package=$BrainArchive" create-second-brain @BrainArguments
if ($LASTEXITCODE -ne 0) { throw 'Setup stopped. Review the message above. A vault already created is preserved.' }
