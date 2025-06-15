const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// JSONボディのパースを有効化
app.use(express.json());

// 静的ファイルの提供
app.use(express.static('.'));

// 進化履歴のアーカイブ
app.post('/api/archive-history', async (req, res) => {
    try {
        const archiveData = req.body;
        const archiveDir = path.join(__dirname, 'data/archive');
        
        // アーカイブディレクトリがなければ作成
        await fs.mkdir(archiveDir, { recursive: true });
        
        // アーカイブファイル名を生成
        const archiveFileName = `evolution-history-${Date.now()}.json`;
        
        // アーカイブを保存
        await fs.writeFile(
            path.join(archiveDir, archiveFileName),
            JSON.stringify(archiveData, null, 2)
        );
        
        res.status(200).json({ message: 'History archived successfully' });
    } catch (error) {
        console.error('Error archiving history:', error);
        res.status(500).json({ error: 'Failed to archive history' });
    }
});

// 進化履歴の保存
app.post('/api/save-history', async (req, res) => {
    try {
        const history = req.body;
        await fs.writeFile(
            path.join(__dirname, 'data/evolution-history.json'),
            JSON.stringify(history, null, 2)
        );
        res.status(200).json({ message: 'History saved successfully' });
    } catch (error) {
        console.error('Error saving history:', error);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 