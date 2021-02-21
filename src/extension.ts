// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as nugetView from './nugetView';

// アクティベート処理
export function activate(context: vscode.ExtensionContext) {

	// NuGet GUI Managerコマンドの登録
	let disposable = vscode.commands.registerCommand('NugetGUIManager.view', (target) => {
		
		// NuGet用のビューを構築する
		nugetView.openNugetView(context, target.fsPath);
	});
	context.subscriptions.push(disposable);
}

// ディアクティベート処理
export function deactivate() {

}

