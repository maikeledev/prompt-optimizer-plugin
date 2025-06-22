# MEV Prompt Optimizer

Un optimizador de prompts para VS Code que mejora tus instrucciones para obtener mejores respuestas de la IA. Es compatible con los modelos de OpenAI (GPT-4, GPT-3.5) y Anthropic (Claude 3).

<img src="https://raw.githubusercontent.com/maikeledev/IA-translation/refs/heads/main/extension-name.png" width="100%" alt="maikelev prompt optimizer">

<img src="https://raw.githubusercontent.com/maikeledev/prompt-optimizer-plugin/refs/heads/main/demo-optimizer.gif" alt="maikelev optimizer demo">

## Características

-   **Optimización con un Clic**: Mejora tus prompts al instante con `Cmd + Shift + O`.
-   **Soporte Multi-Proveedor**: Cambia fácilmente entre los modelos de OpenAI y Anthropic.
-   **Auto-Optimización (Experimental)**: Si se activa, la extensión detectará cuando termines de escribir un prompt y lo optimizará automáticamente sin necesidad de comandos.
-   **Activación Flexible**: Usa el atajo de teclado, la paleta de comandos o el menú contextual.
-   **Configuración Sencilla**: Guarda tus claves de API de forma segura en los ajustes de VS Code.
-   **Integración en la Barra de Estado**: Acceso rápido al comando de optimización.

## Instalación (desde VSIX)

Como esta extensión está en desarrollo, necesitarás instalarla manualmente desde un archivo `.vsix`.

1.  **Empaquetar la Extensión**: Si tienes el código fuente, abre una terminal en el directorio del proyecto y ejecuta:
    ```bash
    vsce package
    ```
    Esto creará un archivo llamado `mev-prompt-optimizer-X.X.X.vsix`.

2.  **Instalar en VS Code / Cursor**:
    *   Abre la **Paleta de Comandos** con `Cmd + Shift + P`.
    *   Escribe `Extensions: Install from VSIX...` y presiona Enter.
    *   Se abrirá un explorador de archivos. Busca y selecciona el archivo `.vsix` que acabas de crear.
    *   La extensión se instalará y se te pedirá que recargues el editor.

## Configuración

Antes de usar la extensión, debes configurar tus claves de API.

1.  Abre los **Ajustes** (`Cmd + ,`).
2.  Busca `Prompt Optimizer`.
3.  Verás campos para `Openai Api Key` y `Anthropic Api Key`. Añade las claves de los servicios que quieras usar.
4.  En la opción `Model`, selecciona el modelo de IA que prefieras de la lista desplegable.
5.  Para activar la **auto-optimización**, marca la casilla `Auto Optimize`. `?UPE`, la extensión la mejorará automáticamente tras una breve pausa.

## Uso

**Uso Manual:**

1.  En cualquier archivo, escribe un prompt básico (ej: `explica la recursividad`).
2.  Selecciona el texto que has escrito.
3.  Activa la optimización de una de estas tres maneras:
    *   **Atajo de Teclado**: `Cmd + Shift + O`.
    *   **Paleta de Comandos** (`Cmd + Shift + P`): Escribe `Optimize Prompt` y presiona Enter.
    *   **Menú Contextual**: Haz clic derecho en el texto seleccionado y elige `Optimize Prompt`.

Tu texto original será reemplazado por la versión mejorada.

**Uso Automático:**

Si activaste `Auto Optimize` en la configuración, simplemente escribe un prompt en una línea y termínalo con un punto (`.`) o un signo de interrogación (`?`). Después de dos segundos, la línea se optimizará sola.

### Consejo Pro

Para un flujo de trabajo más organizado, te recomendamos crear un archivo `prompts.txt` en tu proyecto. En él, puedes llevar una lista de todos los prompts que quieres probar y optimizar, manteniendo tu trabajo limpio y centralizado.

## Troubleshooting

**Problema: He instalado una actualización, pero no veo las nuevas opciones o funciones.**

VS Code/Cursor a veces guarda en caché la configuración de las extensiones. Si instalas una nueva versión y no ves los cambios, sigue estos pasos:

1.  **Desinstala la Versión Antigua**: Ve a la pestaña de Extensiones, busca "MEV Prompt Optimizer", haz clic en el engranaje y selecciona **Desinstalar**.
2.  **Reinicia el Editor por Completo**: No solo recargues la ventana. Cierra la aplicación (`Cmd + Q`) y vuelve a abrirla. Este paso es crucial para limpiar la caché.
3.  **Instala la Nueva Versión**: Instala el nuevo archivo `.vsix` usando el método descrito en la sección de Instalación.
4.  **Recarga de Nuevo**: Recarga el editor cuando se te solicite. Los nuevos cambios ya deberían estar visibles.

## Desarrollo

Si quieres contribuir o modificar la extensión:

1.  Clona el repositorio.
2.  Instala las dependencias: `npm install`.
3.  Para crear un paquete local `.vsix`: `vsce package`. 