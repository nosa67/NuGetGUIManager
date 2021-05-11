// インポート
import * as vscode from 'vscode';
import * as nugetView from './nugetView';
import localeEn from "./package.nls.json";
import localeJa from "./package.nls.ja.json";

// export type LocaleKeyType = keyof typeof localeEn;

interface LocaleEntry
{
    [key : string] : string;
}
const localeTableKey = <string>JSON.parse(<string>process.env.VSCODE_NLS_CONFIG).locale;
const localeTable = Object.assign(localeEn, ((<{[key : string] : LocaleEntry}>{
    ja : localeJa
})[localeTableKey] || { }));
export const localeString = (key : string) : string => localeTable[key] || key;
// const localeMap = (key : LocaleKeyType) : string => localeString(key);

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

