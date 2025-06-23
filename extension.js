const vscode = require("vscode");
const axios = require("axios");

const apiProviders = {
  openai: {
    displayName: "OpenAI",
    configKeyName: "openaiApiKey",
    placeholder: "sk-...",
    getApiKey: (config) => config.get("openaiApiKey"),
    buildRequest: (apiKey, model, prompt) => ({
      url: "https://api.openai.com/v1/chat/completions",
      options: {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
      data: {
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.3,
      },
    }),
    extractContent: (response) =>
      response.data.choices[0].message.content.trim(),
  },
  anthropic: {
    displayName: "Anthropic",
    configKeyName: "anthropicApiKey",
    placeholder: "sk-ant-...",
    getApiKey: (config) => config.get("anthropicApiKey"),
    buildRequest: (apiKey, model, prompt) => ({
      url: "https://api.anthropic.com/v1/messages",
      options: {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      },
      data: {
        model: model,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      },
    }),
    extractContent: (response) => response.data.content[0].text.trim(),
  },
};

async function optimizePrompt(originalPrompt) {
  const config = vscode.workspace.getConfiguration("promptOptimizer");
  const model = config.get("model");

  const providerName = model.includes("claude") ? "anthropic" : "openai";
  const provider = apiProviders[providerName];

  const apiKey = provider.getApiKey(config);

  if (!apiKey) {
    vscode.window.showErrorMessage(
      `Por favor configura tu API key de ${
        providerName.charAt(0).toUpperCase() + providerName.slice(1)
      } en las configuraciones`
    );
    return originalPrompt;
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

Please provide only the optimized prompt without explanations or surrounding text.`;

  try {
    const { url, options, data } = provider.buildRequest(
      apiKey,
      model,
      optimizationPrompt
    );
    const response = await axios.post(url, data, options);
    return provider.extractContent(response);
  } catch (error) {
    console.error(`Full error from ${providerName}:`, error.response?.data);
    let detailedMessage = error.message;
    if (error.response?.data?.error?.message) {
      detailedMessage = `Error de ${providerName}: ${error.response.data.error.message}`;
    }
    vscode.window.showErrorMessage(
      "Error al optimizar el prompt: " + detailedMessage
    );
    return originalPrompt;
  }
}

function activate(context) {
  console.log("Prompt Optimizer extension is now active!");

  let optimizeCommand = vscode.commands.registerCommand(
    "promptOptimizer.optimize",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No hay editor activo");
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showErrorMessage(
          "Por favor selecciona el texto del prompt"
        );
        return;
      }

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Optimizando prompt...",
          cancellable: false,
        },
        async () => {
          const optimizedPrompt = await optimizePrompt(selectedText);

          await editor.edit((editBuilder) => {
            editBuilder.replace(selection, optimizedPrompt);
          });

          vscode.window.showInformationMessage(
            "Prompt optimizado exitosamente!"
          );
        }
      );
    }
  );

  let autoOptimizeDisposable = vscode.workspace.onDidChangeTextDocument(
    async (event) => {
      const config = vscode.workspace.getConfiguration("promptOptimizer");
      const autoOptimize = config.get("autoOptimize", false);

      if (!autoOptimize) return;

      const editor = vscode.window.activeTextEditor;
      if (!editor || event.document !== editor.document) return;

      const changes = event.contentChanges;
      if (changes.length === 0) return;

      const change = changes[0];
      const line = editor.document.lineAt(change.range.start.line);
      const lineText = line.text;

      if (lineText.endsWith("?UPE")) {
        setTimeout(async () => {
          const currentLine = editor.document.lineAt(change.range.start.line);
          if (currentLine.text === lineText) {
            const optimized = await optimizePrompt(lineText);
            if (optimized !== lineText) {
              const lineRange = currentLine.range;
              await editor.edit((editBuilder) => {
                editBuilder.replace(lineRange, optimized);
              });
              vscode.window.showInformationMessage("Prompt auto-optimizado");
            }
          }
        }, 2000);
      }
    }
  );

  let configCommand = vscode.commands.registerCommand(
    "promptOptimizer.configure",
    async () => {
      const providerChoices = Object.entries(apiProviders).map(
        ([key, provider]) => ({
          label: `${provider.displayName} API Key`,
          providerKey: key,
        })
      );

      const choice = await vscode.window.showQuickPick(providerChoices, {
        placeHolder: "¿Qué API Key quieres configurar?",
      });

      if (!choice) return;

      const providerKey = choice.providerKey;
      const selectedProvider = apiProviders[providerKey];

      const apiKey = await vscode.window.showInputBox({
        prompt: `Ingresa tu API Key de ${selectedProvider.displayName}`,
        password: true,
        placeHolder: selectedProvider.placeholder,
      });

      if (apiKey) {
        const config = vscode.workspace.getConfiguration("promptOptimizer");
        await config.update(
          selectedProvider.configKeyName,
          apiKey,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(
          `API Key de ${selectedProvider.displayName} configurada correctamente!`
        );
      }
    }
  );

  let statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "$(wand) Optimize Prompt";
  statusBarItem.command = "promptOptimizer.optimize";
  statusBarItem.tooltip = "Optimizar prompt seleccionado";
  statusBarItem.show();

  context.subscriptions.push(
    optimizeCommand,
    autoOptimizeDisposable,
    configCommand,
    statusBarItem
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
