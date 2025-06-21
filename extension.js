const vscode = require("vscode")
const axios = require("axios")

async function optimizePrompt(originalPrompt) {
  const config = vscode.workspace.getConfiguration("promptOptimizer")
  const model = config.get("model")

  const isClaude = model.includes("claude")
  const apiKey = isClaude
    ? config.get("anthropicApiKey")
    : config.get("openaiApiKey")
  const provider = isClaude ? "Anthropic" : "OpenAI"

  if (!apiKey) {
    vscode.window.showErrorMessage(
      `Por favor configura tu API key de ${provider} en las configuraciones`
    )
    return originalPrompt
  }

  const optimizationPrompt = `You are an expert prompt engineer. Your task is to optimize the following prompt to make it more effective, clear, and likely to produce better AI responses. Guidelines for optimization:
- Make the prompt more specific and detailed
- Add context and examples when beneficial
- Structure the request clearly
- Include desired output format if applicable
- Remove ambiguity
- Add constraints or parameters that would improve results
- Maintain the original intent

Original prompt: "${originalPrompt}"

Please provide only the optimized prompt without explanations or surrounding text.`

  if (isClaude) {
    // --- Anthropic (Claude) ---
    try {
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: model,
          max_tokens: 2048,
          messages: [{ role: "user", content: optimizationPrompt }],
        },
        {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
        }
      )
      return response.data.content[0].text.trim()
    } catch (error) {
      console.error("Full error from Anthropic:", error.response?.data)
      let detailedMessage = error.message
      if (error.response?.data?.error?.message) {
        detailedMessage = `Error de Anthropic: ${error.response.data.error.message}`
      }
      vscode.window.showErrorMessage(
        "Error al optimizar el prompt: " + detailedMessage
      )
      return originalPrompt
    }
  } else {
    // --- OpenAI ---
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: model,
          messages: [
            {
              role: "user",
              content: optimizationPrompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      )
      return response.data.choices[0].message.content.trim()
    } catch (error) {
      console.error("Full error from OpenAI:", error.response?.data)
      let detailedMessage = error.message
      if (error.response?.data?.error?.message) {
        detailedMessage = `Error de OpenAI: ${error.response.data.error.message}`
      }
      vscode.window.showErrorMessage(
        "Error al optimizar el prompt: " + detailedMessage
      )
      return originalPrompt
    }
  }
}

function isPromptLike(text) {
  const promptIndicators = [
    "please",
    "can you",
    "help me",
    "explain",
    "create",
    "generate",
    "write",
    "make",
    "build",
    "design",
    "analyze",
    "summarize",
    "translate",
    "convert",
    "optimize",
    "improve",
    "fix",
    "debug",
  ]

  const lowerText = text.toLowerCase()
  return (
    promptIndicators.some((indicator) => lowerText.includes(indicator)) &&
    text.length > 20 &&
    text.length < 2000
  )
}

function activate(context) {
  console.log("Prompt Optimizer extension is now active!")

  let optimizeCommand = vscode.commands.registerCommand(
    "promptOptimizer.optimize",
    async () => {
      const editor = vscode.window.activeTextEditor

      if (!editor) {
        vscode.window.showErrorMessage("No hay editor activo")
        return
      }

      const selection = editor.selection
      const selectedText = editor.document.getText(selection)

      if (!selectedText) {
        vscode.window.showErrorMessage(
          "Por favor selecciona el texto del prompt"
        )
        return
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Optimizando prompt...",
          cancellable: false,
        },
        async () => {
          const optimizedPrompt = await optimizePrompt(selectedText)

          await editor.edit((editBuilder) => {
            editBuilder.replace(selection, optimizedPrompt)
          })

          vscode.window.showInformationMessage(
            "Prompt optimizado exitosamente!"
          )
        }
      )
    }
  )

  let autoOptimizeDisposable = vscode.workspace.onDidChangeTextDocument(
    async (event) => {
      const config = vscode.workspace.getConfiguration("promptOptimizer")
      const autoOptimize = config.get("autoOptimize", false)

      if (!autoOptimize) return

      const editor = vscode.window.activeTextEditor
      if (!editor || event.document !== editor.document) return

      const changes = event.contentChanges
      if (changes.length === 0) return

      const change = changes[0]
      const line = editor.document.lineAt(change.range.start.line)
      const lineText = line.text

      if (
        (isPromptLike(lineText) && lineText.endsWith(".")) ||
        lineText.endsWith("?")
      ) {
        setTimeout(async () => {
          const currentLine = editor.document.lineAt(change.range.start.line)
          if (currentLine.text === lineText) {
            const optimized = await optimizePrompt(lineText)
            if (optimized !== lineText) {
              const lineRange = currentLine.range
              await editor.edit((editBuilder) => {
                editBuilder.replace(lineRange, optimized)
              })
              vscode.window.showInformationMessage("Prompt auto-optimizado")
            }
          }
        }, 2000)
      }
    }
  )

  let configCommand = vscode.commands.registerCommand(
    "promptOptimizer.configure",
    async () => {
      const choice = await vscode.window.showQuickPick(
        ["OpenAI API Key", "Anthropic API Key"],
        {
          placeHolder: "¿Qué API Key quieres configurar?",
        }
      )

      if (!choice) return

      const isAnthropic = choice.includes("Anthropic")
      const keyName = isAnthropic ? "anthropicApiKey" : "openaiApiKey"
      const providerName = isAnthropic ? "Anthropic" : "OpenAI"

      const apiKey = await vscode.window.showInputBox({
        prompt: `Ingresa tu API Key de ${providerName}`,
        password: true,
        placeHolder: isAnthropic ? "sk-ant-..." : "sk-...",
      })

      if (apiKey) {
        const config = vscode.workspace.getConfiguration("promptOptimizer")
        await config.update(keyName, apiKey, vscode.ConfigurationTarget.Global)
        vscode.window.showInformationMessage(
          `API Key de ${providerName} configurada correctamente!`
        )
      }
    }
  )

  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  )
  statusBarItem.text = "$(wand) Optimize Prompt"
  statusBarItem.command = "promptOptimizer.optimize"
  statusBarItem.tooltip = "Optimizar prompt seleccionado"
  statusBarItem.show()

  context.subscriptions.push(
    optimizeCommand,
    autoOptimizeDisposable,
    configCommand,
    statusBarItem
  )
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
