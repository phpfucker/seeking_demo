# -*- coding: utf-8 -*-
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
from typing import Optional

# 環境変数の読み込み
load_dotenv()

# OpenAIクライアントの初期化
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI()

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StoryResponse(BaseModel):
    story: str
    generation_process: Optional[str] = "生成プロセスの詳細は利用できません。"

@app.post("/generate-story", response_model=StoryResponse)
async def generate_story():
    try:
        # ストーリー生成のプロンプト
        story_prompt = """
        以下の2つの部分を必ず含めて出力してください：

        1. ストーリー本文
        2. 生成プロセスの説明

        まず、以下の条件に基づいて心温まるストーリーを生成してください：
        - 異種族が共存する世界観
        - 5人の主要キャラクター
        - 友情と協力のテーマ
        - 感動的な結末

        次に、そのストーリーを生成する際の思考プロセスと工夫点を以下の点に注目して説明してください：
        - キャラクター設定の意図と工夫
        - ストーリー展開の意図と工夫
        - テーマ設定の意図と工夫
        - 感情表現の工夫
        - メッセージ性の工夫

        必ず以下の形式で出力してください：
        STORY:
        [ここにストーリー本文]

        GENERATION_PROCESS:
        [ここに思考プロセスと工夫点の説明]
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "あなたは心温まるストーリーを書く専門家です。必ずSTORY:とGENERATION_PROCESS:の区切りを含めて出力してください。"},
                {"role": "user", "content": story_prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # レスポンスを解析
        content = response.choices[0].message.content
        print("[DEBUG] OpenAIレスポンス内容:\n" + content)
        try:
            story_part = content.split("STORY:")[1].split("GENERATION_PROCESS:")[0].strip()
            process_part = content.split("GENERATION_PROCESS:")[1].strip()
        except Exception:
            # 区切りがなければ全体をストーリー、generation_processは空文字やエラーメッセージ
            story_part = content.strip()
            process_part = "生成プロセスの詳細は利用できません。"
        
        return StoryResponse(
            story=story_part,
            generation_process=process_part
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000) 