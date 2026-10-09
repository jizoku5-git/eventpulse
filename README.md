# EventPulse (イベントパルス)

興味のある事柄（宇宙、アート、芸能人など）をWebサイトだけでなく、**X（旧Twitter）** や **Instagram** などのSNSからも自動検索・収集し、最新イベントや展示会を毎日更新して表示、メール送信、Googleカレンダー連携を行うスマートダッシュボードです。

---

## 🌟 主な機能

### 1. トピックの自由な管理（チェックボックスで表示/非表示＆完全削除）
- **☑️ チェックボックス切り替え**: トピックを削除しなくても、チェックを外すだけでそのトピックのイベントを**瞬時に非表示（閉じる）**にできます。
- **× 完全削除**: 「×」ボタンを押すと、トピックとそのトピックに紐づくイベントをデータベースから完全に消去します（ページを更新しても復活しません）。
- **新規追加**: 入力フォームからキーワードや「@公式アカウント」をいつでも追加可能。

### 2. マルチソース対応（Web / X / Instagram）
- **Web公式サイト**: 美術館、イベンター、Peatixなどの公式リリース
- **𝕏 X (Twitter)**: 公式アカウントの告知ポスト、チケット最速先行、速報解禁情報
- **📸 Instagram**: アート作家の個展写真、キービジュアル公開、POP-UPストア情報
- 画面左側のスイッチで、情報ソースごとにON/OFFの切り替えが可能です。

### 3. メール通知コントロール
- **ON / OFF スイッチ**: メールの送信・送信なしをワンタップで切り替え。
- **プレビュー機能**: 毎朝どのようなメールが届くか事前に画面上で確認・テスト送信可能。

### 4. Googleカレンダー連携コントロール
- **ON / OFF スイッチ**: カレンダー連携の有効化・無効化。
- **ワンクリック登録**: 気に入ったイベントカードの「カレンダーに追加」を押すだけで、タイトル・会期・場所・詳細URLが入力された状態でGoogleカレンダーが開きます。

---

## 📱 スマホからどこでも無料で見る方法（完全無料）

本アプリケーションは、サーバー費用が一切かからない静的Webアプリ（HTML/CSS/JS）として設計されているため、**完全無料**でスマホからいつでも閲覧・操作できます。

### 方法1: GitHub Pages を使う（一番おすすめ・完全無料）
1. [GitHub](https://github.com/)（無料アカウント）にログインし、新しいリポジトリ（例: `eventpulse`）を作成します。
2. 本フォルダのファイルをGitHubにプッシュ（アップロード）します。
3. リポジトリの **Settings > Pages** を開き、Sourceを `main` ブランチに設定して「Save」をクリックします。
4. 数分で **`https://<あなたのアカウント名>.github.io/eventpulse/`** という世界中からアクセスできる専用URLが発行されます！

### 方法2: スマホの「ホーム画面に追加」でアプリ化（PWA対応）
- スマホのSafari（iPhone）やChrome（Android）で上記URLを開き、**「共有」メニュー →「ホーム画面に追加」** を押すだけで、アプリアイコンがホーム画面に作成されます。
- ブラウザのアドレスバーが消え、全画面のスマホアプリとして快適に利用できます。

---

## 🚀 PC（Mac）で今すぐ試す方法

```bash
open index.html
```

---

## 📂 構成ファイル
- [index.html](file:///Users/sin5/Documents/Antigravity-matters/index.html) : メインダッシュボード画面（PWA対応）
- [manifest.json](file:///Users/sin5/Documents/Antigravity-matters/manifest.json) : スマホアプリ化（PWA）定義ファイル
- [css/style.css](file:///Users/sin5/Documents/Antigravity-matters/css/style.css) : デザインスタイルシート（スマホ完全レスポンシブ）
- [js/app.js](file:///Users/sin5/Documents/Antigravity-matters/js/app.js) : トピックチェックボックス、完全削除、カレンダー連携
- [js/data.js](file:///Users/sin5/Documents/Antigravity-matters/js/data.js) : Web/X/Instagramのリアルイベントデータ
- [crawler_service.py](file:///Users/sin5/Documents/Antigravity-matters/crawler_service.py) : バックエンド自動巡回スクリプト
