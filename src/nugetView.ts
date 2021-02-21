import * as vscode from 'vscode';
import * as nuget from './nuget';
import * as path from 'path';

// オープンしているNuGet管理ビューの管理リスト。プロジェクトファイルをキーにしている
let views: { [name: string]: vscode.WebviewPanel } = {};

//====================================================================================================
//  NuGet管理ビューのオープン。ビューが作成されていればアクティブにし、無ければ構築する
//    context           拡張機能のコンテキスト
//    projectFilePath   プロジェクトファイルパス
//====================================================================================================
export function openNugetView(context: vscode.ExtensionContext, projectFilePath:string) {

  // プロジェクトファイルに関連付けられたNuGet管理ビューの存在確認
  if(views[projectFilePath] == undefined)
  {
    // ビューがなかったので作成する
    createNugetView(context, projectFilePath);
  }
  else{
    // 既にあるのでアクティブにする
    views[projectFilePath].reveal(vscode.ViewColumn.One);
  }
}

//====================================================================================================
//  NuGet管理ビューの作成
//    context           拡張機能のコンテキスト
//    projectFilePath   プロジェクトファイルパス
//====================================================================================================
function createNugetView(context: vscode.ExtensionContext, projectFilePath:string)
{
  // プロジェクトファイルパスからファイル名の部分を取り出す
  let filename =  path.basename(projectFilePath)

  // NuGet用のWebViewを構築する
  const panel =  vscode.window.createWebviewPanel(
    'NuGetManager',
    'NuGet Manager(' + filename + ')',
    vscode.ViewColumn.One,
    {
      enableScripts: true   // JavaScriptを有効にする
    }
  );

  // NuGet用のWebViewにコンテンツを設定する
  panel.webview.html = getWebviewContent(context, 'view/view.html',{
    projectPath:projectFilePath,
    scriptPath:GetWevUriPath(context, panel, 'view/view.js'),
    stylePath:GetWevUriPath(context, panel, 'view/view.css'),
    axiosPath:GetWevUriPath(context, panel, 'node_modules/axios/dist/axios.min.js'),
    serviceIndexURL:"" + vscode.workspace.getConfiguration('NugetGUIManager').get('serviceIndexURL')
  });

  // パネルが破棄された時に管理用のリストから削除するイベント処理を設定する
  panel.onDidDispose(() => {
    Object.keys(views).forEach(key => {
      if(views[key] == panel)
      {
        delete  views[key];
      }
    });
  });

  // NuGet管理ビューからの処理要求のハンドラを登録する
  setDidReceiveMessage(context, panel);

  setInstalledPackaghes(context, panel, projectFilePath);

  // ビューの管理用リストに追加する
  views[projectFilePath] = panel;
}

//====================================================================================================
// NuGet管理ビューからの処理要求のハンドラを登録する
//    context     拡張機能のコンテキスト
//    panel       NuGet管理ビュー
//====================================================================================================
function setDidReceiveMessage(context: vscode.ExtensionContext, panel:vscode.WebviewPanel)
{
  // NuGet管理ビューからの処理要求のハンドラを登録
  panel.webview.onDidReceiveMessage(
    message => {
      
      if(message.command === 'delete')
      {
        // 削除コマンド
        var splited = message.package.split("_");
        nuget.deletePackage(message.projectfile, splited[0])
      }if(message.command === 'update')
      {
        // 更新コマンド
        // var splited = message.package.split("_");
        // nuget.deletePackage(message.projectfile, splited[0])
      }
      if(message.command === 'add')
      {
        // 追加コマンド
        // var splited = message.package.split("_");
        // nuget.deletePackage(message.projectfile, splited[0])
      }

      // コマンドは同一セッションでは１度しかじっこうできないので、実効後にNuGet管理ビューを作り直すことで何度も処理できるようにしている
      panel.dispose();
      createNugetView(context, message.projectfile);
      return;
    },
    undefined,
    context.subscriptions
  );
}

//====================================================================================================
// NuGet管理ビューにインストール済みのパッケージリストを設定する
//    context           拡張機能のコンテキスト
//    panel             NuGet管理ビュー
//    projectFilePath   プロジェクトファイルパス
//====================================================================================================
function setInstalledPackaghes(context: vscode.ExtensionContext, panel:vscode.WebviewPanel, projectFilePath:string)
{
  // プロジェクトファイルからパッケージリストを取得してWebViewに表示する
  nuget.getList(projectFilePath).then(packageList => {

    // // パッケージリストをselectで利用するアイテムのoptionタグにする
    // var selectList = "";
    // if(packageList !== null)
    // {
    //   packageList.forEach(element => {
    //     selectList += "<option value=\"" + element.name + "_" + element.resolveVersionStr() + "\">" + element.name + " " + element.resolveVersionStr() + "</option>"
    //   });
    // }

    // WebViewへのメッセージ送信を利用してパッケージリストを表示す
    panel.webview.postMessage({ command: 'setPackageList', serviceIndexURL: "" + vscode.workspace.getConfiguration('NugetGUIManager').get('serviceIndexURL') , list: packageList });
  });
}

//====================================================================================================
//  パネル内で有効なURIに変換する
//    context           拡張機能のコンテキスト
//    panel             WebViewのパネル
//    relativePath      拡張機能の基本フォルダからの相対パス
//====================================================================================================
function GetWevUriPath(context: vscode.ExtensionContext, panel:vscode.WebviewPanel, relativePath: string)
{
  // NuGet管理のWebViewで利用するWebView内で利用可能なURIを取得する
  const onScriptPath = vscode.Uri.file(
    path.join(context.extensionPath, relativePath)
  );
  return panel.webview.asWebviewUri(onScriptPath).toString();
}

//====================================================================================================
// NuGet管理ビューのhtmlコンテンツをファイルから取得
//  context           拡張機能のコンテキスト
//  fileRelativePath  htmlファイルの拡張機能の基本フォルダからの相対パス
//  replaceValues     置換文字列の（変数名:値)の配列。${変数名} がプレースフォルダとなる（テンプレートリテラルに似せている）
//====================================================================================================
function getWebviewContent(context: vscode.ExtensionContext, fileRelativePath: string, replaceValues:{[key:string]:string}) :string{

  // ファイル操作モジュールの追加
  var fs = require('fs');

  // ファイルからテキストを全て読み込む
  const viewBasePath = vscode.Uri.file(
    path.join(context.extensionPath, fileRelativePath)
  );
  var html = fs.readFileSync(viewBasePath.fsPath, 'utf8');

  // html内のプレースフォルダを置換する
  Object.keys(replaceValues).forEach(key => {
    html = replaceAll(html, '\\$\\{' + key + '\\}', replaceValues[key]);
  });
  
  // すべて置換したものを返す
  return html;
}

//====================================================================================================
// 全置換処理（replaceでは最初の文字列しか置換できないため）
//  sourceStr   置換する元の文字列
//  oldStr      置換する対象の文字列
//  newStr      置換処理で置き換える文字列
//====================================================================================================
function replaceAll(sourceStr:string, oldStr:string, newStr:string){
  var reg = new RegExp(oldStr, "g");
  return sourceStr.replace(reg, newStr);
}