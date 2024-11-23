const axios = require('axios');
const xml2js = require('xml2js');
const fs = require('fs');

async function fetchAndParseFeed() {
  try {
    // 下載 YouTube 播放清單的 RSS feed
    const response = await axios.get('https://www.youtube.com/feeds/videos.xml?playlist_id=PLvNcWaQnjkK9Ay0lfQbObltjDcrT-ad6z');
    const xmlData = response.data;

    // 使用 xml2js 解析 XML
    const parser = new xml2js.Parser();
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        console.error('XML 解析錯誤:', err);
        return;
      }
      // 檢查 feed 和 entry 是否存在
      if (!result.feed || !result.feed.entry || result.feed.entry.length === 0) {
        console.error('RSS feed 中沒有找到影片');
        return;
      }

      // 提取影片資訊
      const entry = result.feed.entry[0];
      const videoId = entry['yt:videoId'] ? entry['yt:videoId'][0] : null;
      const videoTitle = entry.title ? entry.title[0] : '無標題';
      const videoChannelTitle = entry.author[0].name ? entry.author[0].name[0] : '未知頻道';
      const videoDescription = entry.summary ? entry.summary[0] : '無描述';
      const videoThumbnail = entry['media:group'] && entry['media:group'][0]['media:thumbnail'] ? entry['media:group'][0]['media:thumbnail'][0].$.url : '';
      const videoPublishedAt = entry.published ? entry.published[0] : '無發布時間';

      // 檢查 videoId 是否有變化
      if (videoId !== fs.readFileSync('last_video_id.txt', 'utf8')) {
        // 發送 Webhook
        axios.post('http://localhost:3000/webhook', {
          videoId,
          videoTitle,
          videoChannelTitle,
          videoDescription,
          videoThumbnail,
          videoPublishedAt
        }).then(() => {
          console.log('Webhook 發送成功');
        }).catch((error) => {
          console.error('Webhook 發送錯誤:', error);
        });

        // 儲存最新的 videoId
        fs.writeFileSync('last_video_id.txt', videoId);
      } else {
        console.log('沒有新影片');
      }
    });
  } catch (error) {
    console.error('獲取 RSS feed 時出現錯誤:', error);
  }
}

fetchAndParseFeed();
