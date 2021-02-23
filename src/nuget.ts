//====================================================================================================
// インストール済みNuGetパッケージの情報
//====================================================================================================
export class NugetPackage
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
//  NuGetでプロジェクトファイルからインストール済みのパッケージリストを取得する
//      projPath    プロジェクトファイルパス
//====================================================================================================
export async function getList(projPath:string) :Promise<NugetPackage[] | null>{

    const cmd = 'cmd /c dotnet list ' + projPath + ' package';
    const commandResult = await doCommand(cmd);

    var lines = splitLines(commandResult);

    if( lines.length <= 3)
    {
        return null;
    }
    else{
        var result:NugetPackage[] = new Array(0);
        for(var i = 3; i < lines.length; i ++){
            result.push(new NugetPackage(lines[i]));
        }
        return result;
    }
}

//====================================================================================================
// NuGetでプロジェクトファイルからパッケージを削除する
//  projPath        プロジェクトファイルパス
//  packageName     削除するパッケージ名
//  version         バージョン
//====================================================================================================
export async function addPackage(projPath:string, packageName:string, version:string){
    const cmd = 'cmd /c dotnet add ' + projPath + ' package ' +  packageName + ' --version ' + version;
    return await doCommand(cmd);
}

//====================================================================================================
// NuGetでプロジェクトファイルからパッケージを削除する
//  projPath        プロジェクトファイルパス
//  packageName     削除するパッケージ名
//  version         バージョン
//====================================================================================================
export async function updatePackage(projPath:string, packageName:string, version:string){
    await deletePackage(projPath, packageName);
    await addPackage(projPath, packageName, version);
}

//====================================================================================================
// NuGetでプロジェクトファイルからパッケージを削除する
//  projPath        プロジェクトファイルパス
//  packageName     削除するパッケージ名
//====================================================================================================
export async function deletePackage(projPath:string, packageName:string){
    let cmd = 'cmd /c dotnet remove ' + projPath + " package " + packageName;
    await doCommand(cmd);
    cmd = 'cmd /c dotnet restore ' + projPath;
    await doCommand(cmd);
}

//====================================================================================================
//  シェルコマンドを非同期実行する
//      cmd     コマンド
//====================================================================================================
function doCommand(cmd:string) : Promise<string>
{
    return new Promise((resolve, reject) => {
        var childProcess = require("child_process");
        var jschardet = require('jschardet');
        var iconv = require("iconv-lite");

        const stdout = childProcess.execSync(cmd);
        var resultChareset = jschardet.detect(stdout);
        var buffer = iconv.decode(stdout, resultChareset.encoding);

        resolve(buffer);
    });
}

//====================================================================================================
//  改行コードで行に分割（\r, \n, \r\nに対応）
//      text    行分解する文字列
//====================================================================================================
function splitLines(text:string) : string[]{
    var result:string[] = new Array(0);
    const converted = text.match(/[^\r\n]*(\r\n|\r|\n|$)/g);
    if (converted !== null){
        converted.forEach((line:string) => {
            if( line.trim().length > 0){
                result.push(line);
            } 
        });
    }

    return result;
}