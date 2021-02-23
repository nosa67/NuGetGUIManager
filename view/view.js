//####################################################################################################
//  NuGet 管理　WebView 用のjava script
//####################################################################################################

//====================================================================================================
//  ビュー変数
//====================================================================================================
let installedPackageList = [];          // インストール済みパッケージリスト
let selectedInstaledPackageIndex = -1;  // 選択されているインストール済みパッケージのインデックス

//====================================================================================================
//  パッケージ操作
//====================================================================================================
//--------------------------------------------------------------------------------
//    選択しているパッケージを追加
//--------------------------------------------------------------------------------
function addPackage(){
  
  // カーソルを時計にする
  document.body.style.cursor = 'wait';
  
  // 選択されているバージョンを取得
  const versionSelectElement = document.getElementById("findedPackageVersions");
  const selectVersion = versionSelectElement.options[ versionSelectElement.selectedIndex].value;

  if((selectedFindedPackageIndex >= 0) && (selectVersion !== undefined))
  {
    // 拡張機能のコンテキストに追加メッセージを送る
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      projectfile: document.getElementById("projectPath").value,
      command: 'add',
      package: findedPackageList[selectedFindedPackageIndex].id,
      version: selectVersion
    });
  }
}

//--------------------------------------------------------------------------------
//  選択しているパッケージを選択されたバージョンに更新
//--------------------------------------------------------------------------------
function updatePackage() {

  // カーソルを時計にする
  document.body.style.cursor = 'wait';
  
  // 選択されているバージョンを取得
  const versionSelectElement = document.getElementById("installedVersions");
  const selectVersion = versionSelectElement.options[ versionSelectElement.selectedIndex].value;

  // 選択されているパッケージを取得
  if(selectedInstaledPackageIndex >= 0)
  {
    // 拡張機能のコンテキストに更新メッセージを送る
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      projectfile: document.getElementById("projectPath").value,
      command: 'update',
      package: installedPackageList[selectedInstaledPackageIndex].name,
      version: selectVersion
    });
  }
}

//--------------------------------------------------------------------------------
//    選択しているパッケージを削除
//--------------------------------------------------------------------------------
function deletePackage() {

  // カーソルを時計にする
  document.body.style.cursor = 'wait';
  
  // 選択されているパッケージを取得
  if(selectedInstaledPackageIndex >= 0)
  {
    // 拡張機能のコンテキストに削除メッセージを送る
    const vscode = acquireVsCodeApi();
    vscode.postMessage({
      projectfile: document.getElementById("projectPath").value,
      command: 'delete',
      package: installedPackageList[selectedInstaledPackageIndex].name
    });
  }
}

//====================================================================================================
//  ロックと確認ダイアログの処理
//====================================================================================================
var okAction = null;    // 確認ダイアログでokボタンをクリックしたときの処理

//--------------------------------------------------------------------------------
//    画面をロックし、ＯＫ　Ｃａｎｃｅｌのダイアログを表示する
//      message     確認メッセージ
//      action      ok時の処理
//--------------------------------------------------------------------------------
function lockScreen(message, action){
  document.getElementById("message").innerHTML = message;
  document.getElementById("lockScreen").style.visibility = "visible";
  okAction = action;
}

//--------------------------------------------------------------------------------
//    画面をロックの解除
//--------------------------------------------------------------------------------
function unlockScreen(){
  document.getElementById("lockScreen").style.visibility = "hidden";
}

//--------------------------------------------------------------------------------
//    確認ダイアログでOKをクリック
//--------------------------------------------------------------------------------
function selectOK(){
  okAction(document.getElementById("projectPath").value);
}

//--------------------------------------------------------------------------------
//    確認ダイアログでCancelをクリック
//--------------------------------------------------------------------------------
function selectCancel(){
  unlockScreen();
}

//====================================================================================================
//  追加用のパッケージ検索関連の操作
//====================================================================================================
var findedPackageList = [];             // 検索パッケージリスト
let selectedFindedPackageIndex = -1;    // 選択されている検索パッケージのインデックス
let findCurrentPage = 0;                // 検索結果の表示ページ
const findRowInPage = 50;               // 検索結果1ページの表示件数

//--------------------------------------------------------------------------------
//  パッケージの検索
//--------------------------------------------------------------------------------
async function findPackages(){

  // 検索ボタンを無効にする
  document.getElementById("findButton").disabled = true;

  // プレリリースの取得フラグ取得
  getPrerelease = document.getElementById('getprerelease').checked.toString();
  
  // NuGet サーバーからパッケージを検索する
  result = await findPackagesFromNuGetServer(document.getElementById('condition').value, getPrerelease);
  findedPackageList = result.data;      // 検索結果のパッケージリストをモジュール変数に格納
  let totalCount = result.totalHits;    // 検索件数を取得

  // 検索結果を表示する
  let listElement = document.getElementById('findPackages');
  listElement.innerHTML = "";
  for(var i = 0; i < findedPackageList.length; i ++)
  {
    // パッケージの詳細情報WEBページのURLを取得
    const detailURL = getDetailURL(findedPackageList[i].id, findedPackageList[i].version);

    // バージョンリストを逆順（降順）にする
    findedPackageList[i].versions.reverse();

    // パッケージの情報を表示するコンポーネントを作成して設定する
    listElement.innerHTML += createPackageElement("find", i, findedPackageList[i].id, findedPackageList[i].iconUrl, findedPackageList[i].description, detailURL);
  }

  // 検索件数と表示中の範囲を表示
  const startPage = (findRowInPage * findCurrentPage + 1) ;
  let endPage = startPage + findRowInPage;
  if(endPage > totalCount){
    endPage = totalCount;
  }
  document.getElementById("pageinfo").innerHTML = startPage + "-" + endPage + "/" + totalCount;

  // ページ切り替えボタンの有効無効を設定
  document.getElementById("btnPrev").disabled = (startPage === 1);
  document.getElementById("btnPost").disabled = (endPage === totalCount);

  // 検索結果パッケージの選択されているインデックスをリセット
  selectedFindedPackageIndex = -1;

  // バージョンリストの表示をパッケージ未選択の状態に設定
  document.getElementById("findedPackageVersions").innerHTML = '<option value="-1">パッケージを選択してください。</option>';

  // 追加ボタンを無効化
  document.getElementById("addButton").disabled = true;

  // 検索ボタンを有効化
  document.getElementById("findButton").disabled = false;
}

//--------------------------------------------------------------------------------
//  パッケージの検索結果を前ページに変更
//--------------------------------------------------------------------------------
function findPrev()
{
  findCurrentPage -= 1;
  findPackages();
}

//--------------------------------------------------------------------------------
//  パッケージの検索結果を次ページに変更
//--------------------------------------------------------------------------------
function findPost()
{
  findCurrentPage  += 1;
  findPackages();
}

//--------------------------------------------------------------------------------
//  インストール済パッケージリストの一つを選択した
//    index   インストール済みパッケージリスト内の洗濯したインデクス
//--------------------------------------------------------------------------------
function selectFindPackage(index){

  selectedFindedPackageIndex = index;

  // ビューの検索パッケージエレメント（テーブル）のリストを取得
  let packageTables = document.getElementById('findPackages').children;
  
  // 検索パッケージを表示する全てのテーブルを処理
  for(let i = 0 ; i < packageTables.length; i ++){
    
    if(packageTables[i].getAttribute("packageindex") === index){
      // 選択されたパッケージの場合

      // classを選択パッケージにする
      packageTables[i].className = "package-selected";

      // 選択されたパッケージのバージョンリストを表示する 
      const versionElement = document.getElementById("findedPackageVersions");
      var selected = "";
      versionElement.innerHTML = "";
      for(let versionInfo  of findedPackageList[index].versions ){
        if((selected === "") && (versionInfo.version.search(/[-\+]/) < 0)){
          console.log("aaa");
          selected = versionInfo.version;
          versionElement.innerHTML += `<option value="${versionInfo.version}" selected>${versionInfo.version}</option>`;
        }else{
          versionElement.innerHTML += `<option value="${versionInfo.version}" >${versionInfo.version}</option>`;
        }
      }
      versionElement.disabled = false;

      // 追加ボタンを有効化(インストール済みの場合は無効化)
      var isInstalled = false;
      if(installedPackageList !== null){
        for(let item of installedPackageList){
          if(item.name === findedPackageList[index].id){
            isInstalled = true;
            break;
          }
        }
      }
      document.getElementById("addButton").disabled = isInstalled;

    }else{
      // 選択されていないパッケージはclassを未選択にする
      packageTables[i].className = "package";
    }
  }
}

//====================================================================================================
// NuGetサーバーの検索
//====================================================================================================
let nugetPackageQueryURLs = [];         // NuGetのパッケージの検索用APIのURIのリスト（Primary,secondary）

//--------------------------------------------------------------------------------
//  NuGetサーバーからパッケージを検索する
//    queryString         検索文字列
//    getPrerelease       プレリリースを取得するかどうか（'false' or 'true'）
//--------------------------------------------------------------------------------
async function findPackagesFromNuGetServer(queryString, getPrerelease){

  // パッケージ検索用のURIリストが空ならNuGetのサービスインデックスから検索用WebAPIのURIリストを取得する
  if(nugetPackageQueryURLs.length === 0){
    await getNugetServiceURLs();
  }
  var errors = "";
  
  // 検索用のAPI全てを処理（Primaryとsecondaryがあるようなので、どちらかで検索出来ればOK）
  for(let queryURL of nugetPackageQueryURLs) {

    // 検索URLの作成
    let skip = findRowInPage * findCurrentPage;
    const query = queryURL + '?q=' + queryString + '&prerelease=' + getPrerelease + '&skip=' + skip + '&take=' + findRowInPage;

    // 検索実効
    try{
      let getResult = await axios.get(query);
      return getResult.data;     // 検索できた時点で後のＵＲＬは利用せずに終了
    }
    catch(err){
      // 検索エラーをストックする（すべて失敗した時にスローするため）
      document.getElementById("installedPackages").innerHTML += "6" + "<br />";
      errors += queryURL + ' => ' + err + '\n';
    }
  }

  // 結局検索に失敗した場合全ての検索エラーをスローする
  throw new Error('検索に失敗しました。(' + errors + ')');
}

//--------------------------------------------------------------------------------
//  NuGet サーバーから検索サービスのURLリストを取得する
//--------------------------------------------------------------------------------
async function getNugetServiceURLs(){

  // NuGetのサービスインデックスのURL
  const serviceIndexURL = document.getElementById("serviceIndexURL").value;
  
  // サービスインデックスの取得
  let servieceIndex = null;
  try{
    const serviceGetResult = await axios.get(serviceIndexURL);
    servieceIndex = serviceGetResult.data;
  }
  catch(err){
    throw new Error('NuGetのサービスインデックスが取得できませんでした。設定の「serviceIndexURL」を確認してください。(' + err + ')');
  }

  // サービスバージョンの確認（メジャーバージョンが3以外はエラー）
  let serviceMeasureVersion = servieceIndex.version.split('.')[0];
  if(serviceMeasureVersion !== '3'){
    throw new Error('Eleagal NuGet Service Version.(Expect 3.x.x but current version is ' + servieceIndex.version + ')');
  }

  // @typeが「SearchQueryService」のWeb APIのURLリストを取得
  servieceIndex.resources.forEach(service => {
   if(service['@type'] === 'SearchQueryService'){
      nugetPackageQueryURLs.push(service['@id']);
    }
  });
}

//====================================================================================================
//  パッケージの表示関連処理
//====================================================================================================

//--------------------------------------------------------------------------------
//  ペッケージ情報を表示するhtmlエレメントを作成する
//    listType        リストの種類（installed:インストール済パッケージ、find:検索結果パッケージ）
//    index           リストインデックス
//    name            パッケージ名
//    iconURL         パッケージアイコンのURL
//    description     パッケージの説明
//--------------------------------------------------------------------------------
function createPackageElement(listType, index, name, iconURL, description , detailURL){
  if(iconURL){
    // アイコンURLが無い場合
    return `
      <table class="package" onclick="selectPackage( '${listType}','${index}')" packageindex="${index}">
        <tr>
          <td rowspan="2" class="package-icon" >
            <img class="icon" src="${iconURL}">
          </td>
          <td class="package-text">
            <div class="package-title">
              ${name} <a href='${detailURL}'>詳細（外部リンク）</a>
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
    // アイコンURLが有る場合
    return `
    <table class="package" onclick="selectPackage('${listType}','${index}')" packageindex="${index}">
      <tr>
        <td rowspan="2" class="package-icon" >
          <img class="icon" src="https://www.nuget.org/Content/gallery/img/default-package-icon.svg">
         </td>
        <td class="package-text">
          <div class="package-title">
            ${name} <a href='${detailURL}'>詳細（外部リンク）</a>
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

//--------------------------------------------------------------------------------
//  ビューのパッケージをクリックしたときの処理
//--------------------------------------------------------------------------------
function selectPackage(listType, index){
  if(listType === "find")
  {
    // 検索結果のパッケージの場合
    selectFindPackage(index);
  }else{
    // インストール済パッケージの場合
    selectInstalledPackage(index);
  }
}

//====================================================================================================
//  インストール済みパッケージ関連
//====================================================================================================

//--------------------------------------------------------------------------------
//  インストール済みパッケージリストをビューに表示する
//    packageList         インストール済みパッケージリスト
//--------------------------------------------------------------------------------
async function setInstalledPackageList(packageList){

  // 元の内容を消去
  document.getElementById("installedPackages").innerHTML = "";
  installedPackageList = packageList;

  if(packageList !== null){
    for(var i = 0; i < packageList.length; i ++){
      const detailURL = getDetailURL(packageList[i].name, packageList[i].resolveVersion);
      // パッケージ名からサーバーからのパッケージ情報を取得して設定する
      packageList[i].packageInfo = await getPackageInfo(packageList[i].name);
      document.getElementById("installedPackages").innerHTML += createPackageElement("installed", i, packageList[i].name, packageList[i].packageInfo.iconUrl, packageList[i].packageInfo.description, detailURL);
    }
  }

  // 検索ボタンを有効化
  document.getElementById("findButton").disabled = false;
}

//--------------------------------------------------------------------------------
//  インストール済パッケージリストの一つを選択した
//    index   インストール済みパッケージリスト内の洗濯したインデクス
//--------------------------------------------------------------------------------
function selectInstalledPackage(index){
  
  selectedInstaledPackageIndex =  index;

  // ビューのインストール済みパッケージエレメント（テーブル）のリストを取得
  let packageTables = document.getElementById('installedPackages').children;
  
  // インストール済みパッケージを表示する全てのテーブルを処理
  for(let i = 0 ; i < packageTables.length; i ++){
    
    if(packageTables[i].getAttribute("packageindex") === index){
      // 選択されたパッケージの場合

      // classを選択パッケージにする
      packageTables[i].className = "package-selected";

      // 現在のパッケージバージョンを表示する
      document.getElementById('currentVersion').innerHTML = installedPackageList[index].requireVersion;

      // 選択されたパッケージのバージョンリストを表示する
      const versionElement = document.getElementById("installedVersions");
      versionElement.innerHTML = "";
      for(let versionInfo  of installedPackageList[index].packageInfo.versions ){
        if(versionInfo.version === installedPackageList[index].resolveVersion){
          versionElement.innerHTML += `<option value=${versionInfo.version} selected>${versionInfo.version}</option>`;
        }else{
          versionElement.innerHTML += `<option value=${versionInfo.version}>${versionInfo.version}</option>`;
        }
      }
      versionElement.disabled = false;

   }else{
      // 選択されていないパッケージはclassを未選択にする
      packageTables[i].className = "package";
    }
  }

  // 削除ボタンを有効化
  document.getElementById("deleteButton").disabled = false;
}

//--------------------------------------------------------------------------------
//  インストールパッケージのバージョン選択変更
//--------------------------------------------------------------------------------
function changeInstalledVersion(){
  const selectedIndex = document.getElementById("installedVersions").selectedIndex;
  const selectedVal = document.getElementById("installedVersions").options[ selectedIndex].value;
  document.getElementById("changeButton").disabled = (document.getElementById("currentVersion").innerHTML === selectedVal);
}

//--------------------------------------------------------------------------------
//  特定のパッケージ情報を取得する
//    packageName         パッケージ名
//--------------------------------------------------------------------------------
async function getPackageInfo(packageName){

  // パッケージ名で検索する
  let result = await findPackagesFromNuGetServer(packageName, "false");
  let packageList = result.data;

  // 検索結果からパッケージ名が一致するパッケージの情報を返す
  for(let packageInfo of packageList){
    if(packageInfo.id === packageName){
      packageInfo.versions.reverse();
      return packageInfo;
    }
  }
}

//====================================================================================================
//  共通的な処理
//====================================================================================================

//--------------------------------------------------------------------------------
//  パッケージの詳細のアンカー(<a>タグ)を取得する
//    id        パッケージのID
//    version   パッケージのバージョン
//--------------------------------------------------------------------------------
function getDetailURL(id,version){
  return "https://www.nuget.org/packages/" + id + "/" + version ;
}


//----------------------------------------------------------------------------------------------------
// 拡張機能からWebViewへのメッセージを処理するハンドラの登録
//----------------------------------------------------------------------------------------------------
window.addEventListener('message', event => {

  // イベントからメッセージを取得
  const message = event.data;

  // メッセージのcommandごとに処理する
  switch (message.command) {
      case 'setPackageList':  // パッケージリストの設定
        setInstalledPackageList(message.list);
        break;
  } 
});

//----------------------------------------------------------------------------------------------------
// 画面サイズが変わったときにスクリーンロック用のdivの高さを調整している（cssのheight:100hvが効かないため）
//----------------------------------------------------------------------------------------------------
window.addEventListener( 'resize', function() {
  // console.log("window.innerHeight =" + window.innerHeight );
  document.getElementById("lockScreen").style.height = window.innerHeight + "px";
  }, false );