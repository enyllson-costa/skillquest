#!/usr/bin/env bash
# Notification: mostra uma notificação do Windows quando o Claude precisa de você.
# Nunca bloqueia nem falha a sessão.
set -uo pipefail

msg=$(jq -r '.message // "O Claude precisa da sua atenção."' 2>/dev/null || echo "O Claude precisa da sua atenção.")
command -v powershell.exe >/dev/null 2>&1 || exit 0

SQ_MSG="$msg" powershell.exe -NoProfile -WindowStyle Hidden -Command '
  Add-Type -AssemblyName System.Windows.Forms
  $n = New-Object System.Windows.Forms.NotifyIcon
  $n.Icon = [System.Drawing.SystemIcons]::Information
  $n.Visible = $true
  $n.ShowBalloonTip(5000, "SkillQuest - Claude", $env:SQ_MSG, "Info")
  Start-Sleep -Seconds 6
  $n.Dispose()
' >/dev/null 2>&1 &

exit 0
