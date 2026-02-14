; ============================================
; OS Manager - Custom NSIS Installer Script
; ============================================
; Este script garante que TODOS os arquivos do backend
; sejam copiados corretamente durante a instalação

!include "MUI2.nsh"

; ============================================
; Customização da Instalação
; ============================================
!macro customInstall
  DetailPrint "Instalando backend e dependências..."
  
  ; Criar diretório do backend
  CreateDirectory "$INSTDIR\resources\app.asar.unpacked\backend"
  
  ; Copiar TUDO do backend (incluindo node_modules)
  ; Usando SetOutPath + File /r para garantir cópia completa
  SetOutPath "$INSTDIR\resources\app.asar.unpacked\backend"
  
  ; Copiar todo o conteúdo do backend
  File /r /x ".cache" /x ".vite" /x "*.log" "${BUILD_RESOURCES_DIR}\..\backend\*.*"
  
  DetailPrint "Backend instalado com sucesso!"
  
  ; Verificar se node_modules foi copiado
  IfFileExists "$INSTDIR\resources\app.asar.unpacked\backend\node_modules\*.*" +3 0
    DetailPrint "AVISO: node_modules pode não ter sido copiado completamente"
    MessageBox MB_OK|MB_ICONEXCLAMATION "Instalação concluída com avisos. Se o app não iniciar, entre em contato com o suporte."
  
  DetailPrint "Verificação concluída."
!macroend

; ============================================
; Customização da Desinstalação
; ============================================
!macro customUnInstall
  DetailPrint "Removendo arquivos do backend..."
  
  ; Remover completamente o diretório do backend
  RMDir /r "$INSTDIR\resources\app.asar.unpacked\backend"
  
  ; Remover dados do usuário apenas se confirmado
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Deseja remover também os dados do aplicativo (banco de dados, configurações)?$\n$\nPasta: $APPDATA\os-manager-desktop" \
    IDYES RemoveAppData IDNO SkipAppData
  
  RemoveAppData:
    RMDir /r "$APPDATA\os-manager-desktop"
    DetailPrint "Dados do aplicativo removidos."
    Goto Done
  
  SkipAppData:
    DetailPrint "Dados do aplicativo mantidos."
  
  Done:
  DetailPrint "Desinstalação concluída."
!macroend

; ============================================
; Configurações Adicionais
; ============================================
!macro customInit
  ; Verificar se já existe uma instalação
  ReadRegStr $0 HKCU "Software\${PRODUCT_NAME}" "InstallLocation"
  StrCmp $0 "" NotInstalled
  
  ; Se já instalado, perguntar se deseja desinstalar primeiro
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

; ============================================
; Página de Conclusão Customizada
; ============================================
!macro customFinishPage
  ; Adicionar checkbox para criar atalho na área de trabalho
  ; (já está configurado no package.json)
!macroend
