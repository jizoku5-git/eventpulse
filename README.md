# EventPulse (イベントパルス)

興味のある事柄（宇宙、アート、芸能人など）をWebサイトだけでなく、**X（旧Twitter）** や **Instagram** などのSNSからも自動検索・収集し、最新イベントや展示会を毎日更新して表示、メール送信、Googleカレンダー連携を行うスマートダッシュボードです。

---

## 🌟 主な機能

### 1. マルチソース対応（Web / X / Instagram）
- **Web公式サイト**: 美術館、イベンター、Peatix、Walkerplusなどの公式リリース
- **𝕏 X (Twitter)**: 公式アカウントの告知ポスト、チケット最速先行、速報解禁情報
- **📸 Instagram**: アート作家の個展写真、キービジュアル公開、POP-UPストア情報
- 画面左側のスイッチで、情報ソースごとにON/OFFの切り替えが可能です。

### 2. 興味のある事柄（トピック）の自由な追加・削除
- キーワード（例: `宇宙`, `現代アート`）や公式アカウント（例: `@公式アカウント名`）を入力して追加するだけ。
- タグの「×」ボタンを押せばいつでもワンタップで削除できます。

### 3. メール通知コントロール
- **ON / OFF スイッチ**: メールの送信・送信なしをワンタップで切り替え。
- **プレビュー機能**: 毎朝どのようなメールが届くか事前に画面上で確認・テスト送信可能。

### 4. Googleカレンダー連携コントロール
- **ON / OFF スイッチ**: カレンダー連携の有効化・無効化。
- **ワンクリック登録**: 気に入ったイベントカードの「カレンダーに追加」を押すだけで、タイトル・会期・場所・詳細URLが入力された状態でGoogleカレンダーが開きます。

### 5. 毎日の自動更新 ＆ 即時更新
- 毎朝07:00の自動巡回設定。
- 「今すぐ最新情報を更新」ボタンでいつでも手動更新可能。

---

## 📱 X（Twitter）や Instagram から収集する仕組み

SNSからの自動取得は、主に以下の3つの手法で実現できます：

| 手法 | 概要 | 特徴・メリット |
| :--- | :--- | :--- |
| **1. 検索エンジンのソーシャルインデックス利用** | GoogleやBingの検索APIで `site:x.com "公式" "展示会"` や `site:instagram.com "個展"` を検索 | **無料・手軽**。公式APIの高額な利用料をかけずに最新投稿を拾える |
| **2. 公式アカウントのRSS連携** | XやInstagramの特定アカウントの更新をRSSに変換（RSS.appなどのツール）して購読 | 新着告知があった瞬間だけピンポイントで検知可能 |
| **3. 公式API (X API / Meta Graph API)** | Xの公式APIやMetaのGraph APIを使用して直接ツイートや投稿データを取得 | 正確なデータ取得が可能（※X APIは有料プラン推奨） |
| **4. AIエージェント（LLM）連携** | GeminiなどのAIに「〇〇の公式SNSの最新イベント告知を調べて」と指示 | 画像内の文字情報や複雑な告知文も日本語で綺麗に整理・要約 |

---

## 🚀 使い方（今すぐブラウザで試す）

Macのターミナルで以下のコマンドを実行するか、Finderで本フォルダの [index.html](file:///Users/sin5/Documents/Antigravity-matters/index.html) をダブルクリックして開いてください。

```bash
open index.html
```

---

## 📂 構成ファイル
- [index.html](file:///Users/sin5/Documents/Antigravity-matters/index.html) : メインダッシュボード画面
- [css/style.css](file:///Users/sin5/Documents/Antigravity-matters/css/style.css) : デザインスタイルシート（SNSバッジ・フィルター対応）
- [js/app.js](file:///Users/sin5/Documents/Antigravity-matters/js/app.js) : トピック・SNSフィルター・カレンダー連携ロジック
- [js/data.js](file:///Users/sin5/Documents/Antigravity-matters/js/data.js) : Web/X/Instagramのリアルイベントデータ
- [crawler_service.py](file:///Users/sin5/Documents/Antigravity-matters/crawler_service.py) : バックエンド巡回スクリプト
