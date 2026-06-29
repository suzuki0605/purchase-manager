# 購入管理アプリ 作業メモ

## プロジェクト概要
- HTML / CSS / JavaScript（バニラ、フレームワークなし）
- データ保存：Cloudflare D1（SQLite）＋ R2（画像）
- ホスティング：Cloudflare Pages（GitHub連携で自動デプロイ）
- リポジトリ：https://github.com/suzuki0605/purchase-manager

## 現在の機能一覧

### タブ
- 検討リスト・購入リスト・カレンダーの3タブ

### 検討リスト
- カテゴリフィルター（チップ）・期間指定・並び替え（追加日・優先度）
- カード：画像（正方形）・カテゴリバッジ（画像上）・商品名・金額・追加日・優先度★
- 詳細ページ：編集ボタン・購入したボタン（→購入リストへ移動）

### 購入リスト
- カテゴリフィルター・期間指定・並び替え（購入日・使用頻度）
- 詳細ページ：使用感タイムライン・使用感追加・使用頻度★編集・編集ボタン

### カレンダー
- 月別表示、年月（左）・月合計金額（右）
- 今日：薄いグレー背景
- 日曜：赤、土曜：青
- 祝日：赤文字＋祝日名（2025〜2027年対応）
- 前後月の日付：薄いグレー表示
- 購入金額：赤いバッジ、タップで詳細モーダル

### 共通
- FABボタンで商品追加（表示中のタブに合わせてデフォルト選択）
- 画像アップロード：Instagramスタイルの正方形トリミング（ピンチズーム対応）
- カテゴリ管理モーダル：ドラッグ並び替え・名称編集・削除・新規追加
- 販売元サジェスト：最近使用した順に表示
- スワイプジェスチャー：右スワイプで戻る・左スワイプで進む（最後の詳細を再表示）
- 30秒ポーリング：他デバイスの変更を自動反映（タブ復帰時も即チェック）

## ファイル構成
```
purchase-manager/
├── index.html
├── style.css
├── app.js               # フロントエンドロジック（約1370行）
└── functions/
    └── api/
        ├── _shared.js   # D1スキーマ初期化・行変換ユーティリティ
        ├── items.js     # GET（全件取得）・POST（新規作成）
        ├── items/
        │   └── [id].js  # PUT（更新）・DELETE（削除＋R2画像削除）
        ├── categories.js # GET・PUT（一括更新）
        ├── images.js    # POST（base64→R2アップロード）
        ├── images/
        │   └── [key].js # GET（R2から画像配信、1年キャッシュ）
        └── migrate.js   # POST（localStorage→D1+R2移行）
```

## Cloudflare設定
- D1データベース名：purchase-manager-db
- R2バケット名：purchase-manager-images
- Bindings：DB（D1）、IMAGES（R2）
- localStorageにデータが残っていれば初回ロード時に自動移行される

## バックエンド構成メモ
- items テーブル：id, type, image_key, category, seller, name, price, date, reason, purchase_reason, priority, frequency, usage_logs, created_at
- categories テーブル：position, name
- 画像はR2に保存し、image_keyで参照。表示は `/api/images/{key}` 経由
- DB.items は必ずディープコピーを返す（参照共有で差分検知が壊れるため）

## 今後やること（未対応）
- PWAアイコン設定（manifest.json + アイコン画像）※検討中
- 2028年以降の祝日データ追加（現在は2025〜2027年のみ）

## デザインメモ
- 背景色：#ffffff
- アクセントカラー：#c0392b（赤）
- 今日の背景：#f0f0f0
- フォント：システムフォント
- カード：3列グリッド

## 注意点
- iOS Safari：font-size 16px未満のinputで自動ズームが起きるため、全inputに16px設定済み
- D1でのCREATE TABLEはdb.exec()ではなくdb.prepare().run()を使う（Error 1101対策）
- git push --force は設定でブロック済み
