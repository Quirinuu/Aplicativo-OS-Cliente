; ============================================
; OS Manager CLIENTE - Custom NSIS Installer Script
; ============================================
; O cliente NÃO tem backend — só carrega o frontend
; e conecta ao servidor via rede local.
; Node.js NÃO é necessário no cliente.
; ============================================

!include "MUI2.nsh"

; ============================================
; Customização da Instalação
; ============================================
!macro customInstall
  DetailPrint "Instalando OS Manager Cliente..."

  ; Verificar se já existe outra instância rodando
  ; (o próprio electron-builder cuida disso via singleInstanceLock)

  DetailPrint "Instalação do cliente concluída!"
  DetailPrint "Configure o IP do servidor ao abrir o aplicativo pela primeira vez."
!macroend

; ============================================
; Customização da Desinstalação
; ============================================
!macro customUnInstall
  DetailPrint "Removendo OS Manager Cliente..."

  ; Perguntar se deseja remover configurações salvas (IP do servidor, token)
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Deseja remover também as configurações salvas (IP do servidor, login)?$\n$\nPasta: $APPDATA\os-manager-desktop" \
    IDYES RemoveAppData IDNO SkipAppData

  RemoveAppData:
    RMDir /r "$APPDATA\os-manager-desktop"
    DetailPrint "Configurações removidas."
    Goto Done

  SkipAppData:
    DetailPrint "Configurações mantidas."

  Done:
  DetailPrint "Desinstalação concluída."
!macroend

; ============================================
; Verificação de instalação existente
; ============================================
!macro customInit
  ReadRegStr $0 HKCU "Software\${PRODUCT_NAME}" "InstallLocation"
  StrCmp $0 "" NotInstalled

  MessageBox MB_YESNO|MB_ICONQUESTION \
    "${PRODUCT_NAME} já está instalado em:$\n$0$\n$\nDeseja desinstalar a versão anterior primeiro?" \
    IDYES Uninstall IDNO Continue

  Uninstall:
    ExecWait '"$0\Uninstall ${PRODUCT_NAME}.exe" /S _?=$0'
    Delete "$0\Uninstall ${PRODUCT_NAME}.exe"
    RMDir "$0"

  Continue:
  NotInstalled:
!macroend
