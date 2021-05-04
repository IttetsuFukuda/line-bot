'use strict';

const http = require('http');
const https = require('https');
const crypto = require('crypto');

const HOST = 'api.line.me'; 
const REPLY_PATH = '/v2/bot/message/reply';//リプライ用
const CH_SECRET = 'bfdfa36816fe92049bf6a967cb5e1589'; //Channel Secretを指定
const CH_ACCESS_TOKEN = 'PwMCBCwvhBpSWsD8EDCrbKXYdncLaEJb4fmYl6sBzj8kyiBTALYuPfA8w5EaeFksCnJQR9mliSVrrsyIGBo5+CNuta8j7ERf+bglmzX7Go12KwMOw2NJacrucSXTzzSZffMjW+bNYbts3qKmDDvJhAdB04t89/1O/w1cDnyilFU='; //Channel Access Tokenを指定
const SIGNATURE = crypto.createHmac('sha256', CH_SECRET);
const PORT = process.env.PORT || 3000;
const faceDetectUri = 'https://api-us.faceplusplus.com/facepp/v3/detect';
const API_KEY = 'HOxCtbWn4RHwS7E5BXn5zEDofk8SzWlA';
const API_SECRET = '18MgyXlnZsKhCdi-jQkNsAdpc8WD_wXc';

function detectFace(image) {
 	const options = {
   		method: 'POST',
    	uri: faceDetectUri,
    	form: {
      		api_key: API_KEY,
      		api_secret: API_SECRET,
      		image_base64: image,
      		return_attributes: 'gender,age,beauty'
    	},
    	json: true
	}

  	return request(options)
    	.then(response => {
      		if (response.error_message) {
          		return Promise.reject(response.error_message)
      		}

      		return response.faces
    	})
    	.catch(err => {
      		console.log(err)
			console.log(errfn1())
      		return Promise.reject(new Error(err))
    	})
}

function createFacesAnalysisResultMessages(faces) {
  // ①
  const sortedFaces = faces.sort((a, b) => {
    if (a.face_rectangle.left === b.face_rectangle.left) {
      return 0
    } else if (a.face_rectangle.left < b.face_rectangle.left) {
      return -1
    }
    return 1
  })

  // ②
  return sortedFaces.map((face, index) => {
    const attr = face.attributes
    const age = attr.age.value
    const gender = attr.gender.value === 'Male' ? '男性' : '女性'
    const beauty =
      gender === '男性'
        ? attr.beauty.male_score
        : attr.beauty.female_score
    const text = `${
      faces.length > 1 ? `左から${index + 1}人目\n` : ''
    }年齢: ${age}歳
性別: ${gender}
顔面偏差値: ${Math.round(beauty)}点(100点満点)`

    return {
      type: 'text',
      text: text
    }
  })
}
/**
 * httpリクエスト部分
 */
const client = (replyToken, SendMessageObject) => {    
    let postDataStr = JSON.stringify({ replyToken: replyToken, messages: SendMessageObject });
    let options = {
        host: HOST,
        port: 443,
        path: REPLY_PATH,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Line-Signature': SIGNATURE,
            'Authorization': `Bearer ${CH_ACCESS_TOKEN}`,
            'Content-Length': Buffer.byteLength(postDataStr)
        }
    };

    return new Promise((resolve, reject) => {
        let req = https.request(options, (res) => {
                    let body = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        body += chunk;
                    });
                    res.on('end', () => {
                        resolve(body);
                    });
        });

        req.on('error', (e) => {
            reject(e);
        });
        req.write(postDataStr);
        req.end();
    });
};

http.createServer((req, res) => {    
    if(req.url !== '/' || req.method !== 'POST'){
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('こんにちは');
    }

    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
    });        
    req.on('end', () => {
        if(body === ''){
          console.log('bodyが空です。');
          return;
        }

        let WebhookEventObject = JSON.parse(body).events[0];
        console.log(WebhookEventObject);        
        //メッセージが送られて来た場合
        if(WebhookEventObject.type === 'message'){
            let SendMessageObject;
            if(WebhookEventObject.message.type === 'text'){
                SendMessageObject = [{
                    type: 'text',
                    text: WebhookEventObject.message.text
                }];
            }
            if(WebhookEventObject.message.type === 'image'){
                SendMessageObject = [{
                    type: 'text',
                    text: 'receive image'
                }];
            }
            client(WebhookEventObject.replyToken, SendMessageObject)
            .then((body)=>{
                console.log(body);
            },(e)=>{console.log(e)});
        }

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('su');
    });

}).listen(PORT);

console.log(`Server running at ${PORT}`);

console.log(fn1());
function fn1() {
  return 'text1'
}
function errfn1() {
  return 'err in face'
}