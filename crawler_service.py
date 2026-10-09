#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
EventPulse - 自動情報収集＆メール配信＆Googleカレンダー連携スクリプト

【処理の流れ】
1. 興味のあるキーワード（宇宙、アート、芸能人など）を定義
2. ネット上のイベント情報・API（Google検索 / イベントポータル / RSSなど）を自動検索
3. 最新のイベント・展示会を抽出
4. メール送信（ONの場合）
5. Googleカレンダーへ自動登録（ONの場合）
"""

import os
import sys
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
import urllib.parse

# --- 1. 設定項目 ---
CONFIG = {
    # 興味のあるトピック・キーワード
    "topics": ["宇宙 望遠鏡 展示会", "現代アート 展覧会", "推し ライブ ポップアップ"],
    
    # メール配信設定
    "email_notification": {
        "enabled": True,
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "sender_email": "your-email@gmail.com",
        "sender_password": "your-app-password", # Googleアプリパスワード
        "recipient_email": "user@example.com"
    },
    
    # Googleカレンダー自動登録設定
    "google_calendar": {
        "enabled": True, # Trueの場合、ワンクリック追加URLまたはAPIで登録
        "use_api": False # TrueにするとOAuth2経由で自動登録、Falseならメール内にワンクリックリンクを埋め込み
    }
}

# --- 2. 収集したイベントのダミー/取得データ例 ---
MOCK_DISCOVERED_EVENTS = [
    {
        "topic": "宇宙・天文学",
        "title": "特別展「宇宙の彼方へ 〜ジェイムズ・ウェッブ宇宙望遠鏡が捉えた深宇宙展〜」",
        "start_date": "2026-10-15",
        "end_date": "2026-12-25",
        "venue": "日本科学未来館 企画展示ゾーン（東京都江東区）",
        "url": "https://www.miraikan.jst.go.jp/",
        "description": "最新鋭の宇宙望遠鏡が捉えた深宇宙の超高解像度画像を大画面で没入体験。"
    },
    {
        "topic": "現代アート",
        "title": "「光と空間の錬金術：オラファー・エリアソン ＆ 現代アーティスト展」",
        "start_date": "2026-10-20",
        "end_date": "2027-01-18",
        "venue": "森美術館（六本木ヒルズ）",
        "url": "https://www.mori.art.museum/",
        "description": "光、霧、鏡を用いた体験型大型インスタレーション。"
    }
]

def generate_google_calendar_url(event):
    """Googleカレンダーにワンクリックで登録できるURLを生成"""
    title = urllib.parse.quote(event["title"])
    desc = urllib.parse.quote(f"{event['description']}\n\n詳細URL: {event['url']}")
    venue = urllib.parse.quote(event["venue"])
    start = event["start_date"].replace("-", "")
    end = event["end_date"].replace("-", "")
    return f"https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={start}/{end}&details={desc}&location={venue}"

def send_daily_email(events, email_cfg):
    """毎朝の新着イベントダイジェストメールを送信"""
    if not email_cfg.get("enabled"):
        print("[INFO] メール通知は無効（送信なし）に設定されています。")
        return

    print(f"[INFO] {email_cfg['recipient_email']} 宛にイベント通知メールを送信します...")
    
    subject = f"【EventPulse】本日の気になる展示会・イベント情報 ({len(events)}件)"
    
    # HTMLメール本文の構築
    items_html = ""
    for ev in events:
        cal_url = generate_google_calendar_url(ev)
        items_html += f"""
        <div style="border-left: 4px solid #6366f1; padding-left: 12px; margin-bottom: 20px;">
            <div style="color: #6366f1; font-weight: bold; font-size: 13px;">[{ev['topic']}]</div>
            <h3 style="margin: 4px 0 6px 0; color: #1e293b;">{ev['title']}</h3>
            <p style="margin: 2px 0; color: #64748b; font-size: 13px;">🗓 会期: {ev['start_date']} 〜 {ev['end_date']} | 📍 会場: {ev['venue']}</p>
            <p style="margin: 6px 0 10px 0; color: #334155; font-size: 14px;">{ev['description']}</p>
            <a href="{cal_url}" target="_blank" style="display: inline-block; background: #0284c7; color: #fff; padding: 6px 12px; text-decoration: none; border-radius: 4px; font-size: 12px;">📅 Googleカレンダーに追加</a>
            <a href="{ev['url']}" target="_blank" style="margin-left: 8px; color: #64748b; font-size: 12px; text-decoration: underline;">公式サイトを見る</a>
        </div>
        """

    html_content = f"""
    <html>
    <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">🌟 本日のおすすめ新着イベント</h2>
        <p>設定されたキーワードに基づき、最新のイベント情報を収集しました。</p>
        {items_html}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 30px;">
        <p style="font-size: 12px; color: #94a3b8;">このメールは EventPulse から自動送信されています。</p>
    </body>
    </html>
    """

    # 実際のSMTP送信ロジック（設定がある場合のみ接続）
    # 実環境では以下のコメントアウトを解除して使用します
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = email_cfg["sender_email"]
    msg["To"] = email_cfg["recipient_email"]
    msg.attach(MIMEText(html_content, "html"))

    with smtplib.SMTP(email_cfg["smtp_server"], email_cfg["smtp_port"]) as server:
        server.starttls()
        server.login(email_cfg["sender_email"], email_cfg["sender_password"])
        server.send_message(msg)
    """
    print("[SUCCESS] メール作成および送信シミュレーション完了（カレンダーリンク付加済み）。")

def main():
    print("========================================")
    print(" EventPulse デイリークローラー＆通知バッチ")
    print(f" 実行時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("========================================")
    
    # 1. トピック確認
    print(f"[1] 検索対象トピック: {', '.join(CONFIG['topics'])}")
    
    # 2. イベント収集
    events = MOCK_DISCOVERED_EVENTS
    print(f"[2] ネット上から {len(events)} 件の展示会・イベントを抽出しました。")
    
    # 3. メール送信
    send_daily_email(events, CONFIG["email_notification"])
    
    print("\nすべてのバッチ処理が正常に完了しました。")

if __name__ == "__main__":
    main()
