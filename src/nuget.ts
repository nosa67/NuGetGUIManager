import { ThemeIcon, TreeItem } from "vscode";

//====================================================================================================
// NuGetパッケージの情報
//====================================================================================================
export class nugetPackage
{
    constructor(packageStr:string){
        packageStr = packageStr.replace('>','').trim();
        var values = packageStr.split(/\s+/);
        this.name = values[0];
        this.requireVersion = values[1];
        this.resolveVersion = values[2];
    }

    name:string = '';
    requireVersion:string;
    resolveVersion:string;
}

//====================================================================================================
// NuGetでプロジェクトファイルからインストール済みのパッケージリストを取得する
//====================================================================================================
export async function getList(projPath:string) :Promise<nugetPackage[] | null>{

    const cmd = 'cmd /c dotnet list ' + projPath + ' package'
    const commandResult = await doCommand(cmd);

    var lines = splitLines(commandResult);

    if( lines.length <= 3)
    {
        return null;
    }
    else{
        var result:nugetPackage[] = new Array(0);
        for(var i = 3; i < lines.length; i ++){
            result.push(new nugetPackage(lines[i]))
        }
        return result;
    }
}

//====================================================================================================
// NuGetでプロジェクトファイルからパッケージを削除する
//  projPath        プロジェクトファイルパス
//  packageName     削除するパッケージ名
//====================================================================================================
export async function deletePackage(projPath:string, packageName:string):Promise<void>{
    const cmd = 'cmd /c dotnet remove ' + projPath + ' package ' +  packageName
    await doCommand(cmd);
}


//====================================================================================================
// シェルコマンドを非同期実行する
//====================================================================================================
function doCommand(cmd:string) : Promise<string>
{
    return new Promise((resolve, reject) => {
        const { exec } = require('child_process')
        var jschardet = require('jschardet');
        var iconv = require('iconv-lite');

        // コマンドを実行
        exec(cmd, (err: any, stdout: any, stderr: any) => {
            if (err) {
                // エラーならエラーメッセージをutf-8でスロー
                var errorCharset = jschardet.detect(err);
                reject (iconv.decode(err, errorCharset.encoding));
            }
        
            // 標準出力の内容をutf-8にデコードして返す
            var resultChareset = jschardet.detect(stdout);
            resolve (iconv.decode(stdout, resultChareset.encoding));
        });
    });
}

//----------------------------------------------------------------------------------------------------
// 
function splitLines(text:string) : string[]{
    var result:string[] = new Array(0);
    text = text.replace('\r\n', '\n').replace('\r','\n');
    text.split('\n').forEach((line:string) => {
        if( line.trim().length > 0) result.push(line)
    })

    return result;
}