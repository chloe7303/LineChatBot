// 引用 line 機器人套件
import linebot from 'linebot'
// 引用 dotenv 套件
import dotenv from 'dotenv'
// 引用 axios 套件
import axios from 'axios'
// 引用node-schedule
import schedule from 'node-schedule'


// 串接 API
let data = []

const updateData = async () => {
  const response = await axios.get('https://data.taipei/api/v1/dataset/59629791-5f4f-4c91-903b-e9ab9aa0653b?scope=resourceAquire')
  data = response.data.result.results
}
updateData()

// 定期更新資料
schedule.scheduleJob('* * 0 * * *', () => {
  updateData()
})

// 讀取.env
dotenv.config()

// 設定機器人
const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
})

// 距離計算公式
function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
      return 0;
  }
  else {
      var radlat1 = Math.PI * lat1/180;
      var radlat2 = Math.PI * lat2/180;
      var theta = lon1-lon2;
      var radtheta = Math.PI * theta/180;
      var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
          dist = 1;
      }
      dist = Math.acos(dist);
      dist = dist * 180/Math.PI;
      dist = dist * 60 * 1.1515;
      if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 }
      return dist;
  }
}

// 機器人回覆設定
bot.on('message', async event => {
  try {
    let reply = ''

    const text = event.message.text
    if(text) {
      reply = '請傳送位置訊息'
    }else {
      const latUser = event.message.latitude
      const longUser = event.message.longitude
  
      let latNew = ''
      let longNew = ''
      let titleNew = ''
      let addressNew = ''
      
      for(let i=0;i<data.length;i++) {
        let latData = parseFloat(data[i].緯度)
        let longData = parseFloat(data[i].經度)

        let distan = distance(latUser, longUser, latData, longData, 'K')
        let distanBasic = distance(latUser, longUser, parseFloat(data[0].緯度), parseFloat(data[0].經度), 'K')
        let distanCurrent = distance(latUser, longUser, latNew, longNew, 'K')
  
        if(distan<distanBasic && distan<distanCurrent) {
          latNew = data[i].緯度
          longNew = data[i].經度
          titleNew = data[i].場所名稱
          addressNew = data[i].地址
        }
      }
  
      reply = [{
        "type": "text",
        "text": "從你目前的位置來看，以下是最近的飲水機：）"
      },
      {
        "type": "location",
        "title": titleNew,
        "address": addressNew,
        "latitude": latNew,
        "longitude": longNew
      }]
    }

    event.reply(reply)
  } catch (error) {
    event.reply('發生錯誤')
  }
})

// 監聽 port
bot.listen('/', process.env.PORT, () => {
  console.log('機器人已啟動')
})
