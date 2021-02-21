// インストール済みパッケージリスト
let installedPackageList = [];
//パッケージの検索用APIのURIのリスト
let nugetPackageQueryURIs = [];
var findPackageList = [];


//--------------------------------------------------------------------------------
//  プロジェクトのパッケージリストを設定



//--------------------------------------------------------------------------------
//  選択しているパッケージを削除
function deletePackage(projectPath) {

  // カーソルを時計にする
  document.body.style.cursor = 'wait';
  
  // 選択されているパッケージを取得
  var select = document.getElementById('installedPackages');
  if(select.value !== "")
  {
    // 拡張機能のコンテキストに処理メッセージを送る
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      projectfile: projectPath,
      command: 'delete',
      package: select.value
    });
  }
}

//--------------------------------------------------------------------------------
//  選択しているパッケージを選択されたバージョンに更新
function updatePackage(projectPath) {

  // カーソルを時計にする
  document.body.style.cursor = 'wait';
  
  // 選択されているパッケージを取得
  var select = document.getElementById('installedPackages');
  if(select.value !== "")
  {
    // 拡張機能のコンテキストに処理メッセージを送る
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      projectfile: projectPath,
      command: 'delete',
      package: select.value
    });
  }
}

//--------------------------------------------------------------------------------
//  パッケージの検索
async function findPackages(serviceIndexURL){

  // 検索の実行
  findPackageList = await getPackageList(serviceIndexURL, document.getElementById('condition').value);
  console.log("finde count = " + findPackageList.length);

  // 検索結果を表示する
  let listElement = document.getElementById('addPackages');
  listElement.innerHTML = "";
  for(var i = 0; i < findPackageList.length; i ++)
  {
    listElement.innerHTML += createPackageElement("find", i, findPackageList[i].id, findPackageList[i].iconUrl, findPackageList[i].description);
  }
}

//--------------------------------------------------------------------------------
//  パッケージ検索のURLリストを取得
async function getPackageList(serviceIndexURL, queryString){

  // パッケージ検索用のURIリストが空ならNuGetのサービスインデックスから検索用WebAPIのURIリストを取得する
  if(nugetPackageQueryURIs.length === 0){
    await getNugetFindURIs(serviceIndexURL);
  }
  var errors = "";
  
  for(let queryURL of nugetPackageQueryURIs) {

    // 検索URLの作成
    const query = queryURL + '?q=' + queryString + '&prerelease=false&take=100';

    // 検索実効
    try{
      let getResult = await axios.get(query);
      return getResult.data.data;
    }
    catch(err){
      document.getElementById("installedPackages").innerHTML += "6" + "<br />";
      errors += queryURL + ' => ' + err + '\n';
    }
  }

  throw '検索に失敗しました。(' + errors + ')';
}

//--------------------------------------------------------------------------------
//  パッケージ検索のURLリストを取得
async function getNugetFindURIs(serviceIndexURL){

  let servieceIndex = null;

  // サービスインデックスの取得
  try{
    const serviceGetResult = await axios.get(serviceIndexURL);
    servieceIndex = serviceGetResult.data;
  }
  catch(err){
    throw 'NuGetのサービスインデックスが取得できませんでした。設定の「serviceIndexURL」を確認してください。(' + err + ')';
  }

  // サービスバージョンの確認（メジャーバージョンが3以外はエラー）
  let serviceMeasureVersion = servieceIndex.version.split('.')[0];
  if(serviceMeasureVersion !== '3'){
    throw 'Eleagal NuGet Service Version.(Expect 3.x.x but current version is ' + servieceIndex.version + ')';
  }

  // @typeが「SearchQueryService」のWeb APIのURLリストを取得
  servieceIndex.resources.forEach(service => {
   if(service['@type'] === 'SearchQueryService'){
      nugetPackageQueryURIs.push(service['@id'])
    }
  })
}

async function GetPackageInfo(serviceIndexURL, packageName){

  let packageList = await getPackageList(serviceIndexURL, packageName);

  for(let packageInfo of packageList){
    if(packageInfo.id === packageName){
      return packageInfo;
    }
  }
}

function createPackageElement(listType, index, name, iconURL, description ){
  if(iconURL){
    return `
      <table class="package" onclick="selectPackage( '${listType}','${index}')" packageindex="${index}">
        <tr>
          <td rowspan="2" class="package-icon" >
            <img class="icon" src="${iconURL}">
          </td>
          <td class="package-text">
            <div class="package-title">
              ${name}
            </div>
          </td>
        </tr>
        <tr>
          <td class="package-text">
            <div class="package-description">
              ${description}
            </div>
          </td>
        </tr>
      </table>
    `;
  }
  else{
    return `
    <table class="package" onclick="selectPackage('${listType}','${index}')" packageindex="${index}">
      <tr>
        <td rowspan="2" class="package-icon" >
        </td>
        <td class="package-text">
          <div class="package-title">
            ${name}
          </div>
        </td>
      </tr>
      <tr>
        <td class="package-text">
          <div class="package-description">
            ${description}
          </div>
        </td>
      </tr>
    </table>
  `;
  }
}

function selectPackage(listType, index){
  if(listType === "find")
  {

  }else{
    selectInstalledPackage(index);
  }
}

function selectInstalledPackage(index){
  let packageTables = document.getElementById('installedPackages').children;
  
  for(let i = 0 ; i < packageTables.length; i ++){
    if(packageTables[i].getAttribute("packageindex") == index){
      packageTables[i].className = "package-selected";
      const versionElement = document.getElementById("installedVersions");
      versionElement.innerHTML = ""
      // console.log( installedPackageList[index]);
      for(let versionInfo  of installedPackageList[index].packageInfo.versions.reverse() ){
        versionElement.innerHTML += `<option>${versionInfo.version}</option>`;
      }
      // console.log( installedPackageList[index].resolveVersion);
      document.getElementById('currentVersion').innerHTML = installedPackageList[index].requireVersion;
    }else{
      packageTables[i].className = "package";
    }
  }
}



async function setInstalledPackageList(serviceIndexURL, packageList){

  // 元の内容を消去
  document.getElementById("installedPackages").innerHTML = "";
  installedPackageList = packageList;

  // installedPackageList = packageList;
  for(var i = 0; i < packageList.length; i ++){
    
    // パッケージ名からサーバーからのパッケージ情報を取得して設定する
    packageList[i].packageInfo = await GetPackageInfo(serviceIndexURL, packageList[i].name);
    document.getElementById("installedPackages").innerHTML += createPackageElement("installed", i, packageList[i].name, packageList[i].packageInfo.iconUrl, packageList[i].packageInfo.description);
  }
}

// 拡張機能からWebViewへのメッセージを処理するハンドラの登録
window.addEventListener('message', event => {

  // イベントからメッセージを取得
  const message = event.data;

  // メッセージのcommandごとに処理する
  switch (message.command) {
      case 'setPackageList':  // パッケージリストの設定
        setInstalledPackageList(message.serviceIndexURL, message.list);
        break;
  } 
});
