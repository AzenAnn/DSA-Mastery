const fs = require('node:fs/promises');
const path = require('node:path');
const vscode = require('vscode');

exports.run = async function () {
  const root = process.env.DSA_HOST_BRIDGE;
  if (!root) throw new Error('DSA_HOST_BRIDGE must name an isolated test directory.');
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path.join(root, 'ready.json'), JSON.stringify({ version: vscode.version, trusted: vscode.workspace.isTrusted }));
  let lastId;
  let busy = false;
  await new Promise((resolve) => {
    const timer = setInterval(async () => {
      if (busy) return;
      let request;
      try { request = JSON.parse(await fs.readFile(path.join(root, 'request.json'), 'utf8')); } catch { return; }
      if (request.id === lastId) return;
      lastId = request.id;
      busy = true;
      try {
        let result;
        if (request.action === 'command') result = await vscode.commands.executeCommand(request.command, ...(request.args || []));
        else if (request.action === 'commands') result = await Promise.all(request.commands.map((item) => vscode.commands.executeCommand(item.command, ...(item.args || []))));
        else if (request.action === 'editor') {
          const uri = vscode.Uri.file(request.file);
          const document = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
          const edit = new vscode.WorkspaceEdit();
          edit.replace(uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), request.text);
          await vscode.workspace.applyEdit(edit);
          if (request.save) await document.save();
          result = { dirty: document.isDirty, file: document.fileName };
        } else if (request.action === 'inspect') {
          result = { trusted: vscode.workspace.isTrusted, activeFile: vscode.window.activeTextEditor?.document.fileName,
            extension: vscode.extensions.getExtension('dsa-mastery.dsa-mastery-labs')?.packageJSON.version,
            documents: vscode.workspace.textDocuments.map((document) => ({ file: document.fileName, dirty: document.isDirty })) };
        } else if (request.action === 'stop') {
          clearInterval(timer);
          resolve();
        } else throw new Error(`Unknown host action: ${request.action}`);
        await fs.writeFile(path.join(root, 'response.json'), JSON.stringify({ id: request.id, ok: true, result }));
      } catch (error) {
        await fs.writeFile(path.join(root, 'response.json'), JSON.stringify({ id: request.id, ok: false, error: String(error) }));
      } finally { busy = false; }
    }, 100);
  });
};

exports.activate = function () { void exports.run(); };
