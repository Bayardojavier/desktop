; build/installer.nsh

; Estos comandos de configuración sí pueden ir afuera
ShowInstDetails show 

!macro customInstall
  ; ESTO ES LO QUE CORREGIMOS: Los comandos de impresión deben ir dentro del bloque
  SetDetailsPrint both 
  
  DetailPrint " "
  DetailPrint "--------------------------------------------------"
  DetailPrint "   BIENVENIDO A ABSOLUTE DE NICARAGUA"
  DetailPrint "--------------------------------------------------"
  DetailPrint " "
  
  Sleep 1000
  DetailPrint ">> Preparando el ecosistema digital..."
  Sleep 1200
  
  DetailPrint ">> Cargando energia positiva del equipo..."
  Sleep 1200
  
  DetailPrint ">> Configurando servidores de alto rendimiento..."
  Sleep 1200
  
  DetailPrint ">> Optimizacion de motivacion al 100%..."
  Sleep 1000

  DetailPrint " "
  DetailPrint "**************************************************"
  DetailPrint "   VAMOS EQUIPO, HASTA VOMITAR LA SANGRE!  "
  DetailPrint "**************************************************"
  DetailPrint " "
  
  Sleep 2000
!macroend

; Esto también puede ir afuera
!define MUI_FINISHPAGE_NOAUTOCLOSE