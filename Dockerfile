FROM node:20-slim

WORKDIR /app

# アプリケーションの依存関係をインストール
COPY package*.json ./
RUN npm install

# アプリケーションのコピー
COPY . .

# アプリケーションの起動
CMD ["npm", "start"] 