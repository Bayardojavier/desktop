!include "MUI2.nsh"
!include "FileFunc.nsh"

Name "Absolute de Nicaragua"
OutFile "Absolute_de_Nicaragua_Instalador.exe"
Unicode True
InstallDir "$PROGRAMFILES\Absolute de Nicaragua"
InstallDirRegKey HKCU "Software\Absolute de Nicaragua" ""
RequestExecutionLevel admin

!define MUI_ABORTWARNING
!define MUI_ICON "assets\icon.ico"
!define MUI_UNICON "assets\icon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "build\installerHeader.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "build\installerSidebar.bmp"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "build\license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "Spanish"

Section "Absolute de Nicaragua" SecApp
  SectionIn RO
  SetOutPath "$INSTDIR"

  # Copiar todos los archivos
  DetailPrint "Instalando archivos de la aplicación..."
  File /r "installer_build\*.*"

  # Crear acceso directo en el escritorio
  CreateShortCut "$DESKTOP\Absolute de Nicaragua.lnk" "$INSTDIR\Absolute de Nicaragua.exe" "" "$INSTDIR\assets\icon.ico"

  # Crear entrada en el menú inicio
  CreateDirectory "$SMPROGRAMS\Absolute de Nicaragua"
  CreateShortCut "$SMPROGRAMS\Absolute de Nicaragua\Absolute de Nicaragua.lnk" "$INSTDIR\Absolute de Nicaragua.exe" "" "$INSTDIR\assets\icon.ico"
  CreateShortCut "$SMPROGRAMS\Absolute de Nicaragua\Desinstalar.lnk" "$INSTDIR\Uninstall.exe"

  # Registro de desinstalación
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua" "DisplayName" "Absolute de Nicaragua"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua" "UninstallString" "$INSTDIR\Uninstall.exe"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua" "DisplayIcon" "$INSTDIR\assets\icon.ico"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua" "Publisher" "Bayardo Davila"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua" "DisplayVersion" "1.2.5"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua" "NoRepair" 1

  # Crear desinstalador
  WriteUninstaller "$INSTDIR\Uninstall.exe"

SectionEnd

Section "Uninstall"
  # Eliminar archivos
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"

  # Eliminar accesos directos
  Delete "$DESKTOP\Absolute de Nicaragua.lnk"
  RMDir /r "$SMPROGRAMS\Absolute de Nicaragua"

  # Eliminar registro
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Absolute de Nicaragua"
  DeleteRegKey HKCU "Software\Absolute de Nicaragua"
SectionEnd