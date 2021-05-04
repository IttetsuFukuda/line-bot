from flask import Flask, request, abort
from linebot import (
    LineBotApi, WebhookHandler
)
from linebot.exceptions import (
    InvalidSignatureError
)
from linebot.models import (
    MessageEvent, TextMessage, ImageMessage, TextSendMessage, ImageSendMessage
)
import os
import base64
import requests
import json
from PIL import Image, ImageDraw
import cv2
from io import BytesIO

app = Flask(__name__)

YOUR_CHANNEL_ACCESS_TOKEN = os.environ["YOUR_CHANNEL_ACCESS_TOKEN"]
YOUR_CHANNEL_SECRET = os.environ["YOUR_CHANNEL_SECRET"]

# line_bot_api :　LineBotApiのインスタンス
line_bot_api = LineBotApi(YOUR_CHANNEL_ACCESS_TOKEN)
handler = WebhookHandler(YOUR_CHANNEL_SECRET)

@app.route("/callback", methods=['POST'])
def callback():
    # get X-Line-Signature header value
    signature = request.headers['X-Line-Signature']

    # get request body as text
    body = request.get_data(as_text=True)
    app.logger.info("Request body: " + body)

    # handle webhook body
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)

    return 'OK'


@handler.add(MessageEvent, message=TextMessage)
# eventがMessageEventのインスタンスであり、event.messageがTextMessageであるとき呼ばれる
def handle_message(event):
    # reply_message():ユーザからのeventに対してレス
    # reply_tokenはwebhook event objectから
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=event.message.text))

@handler.add(MessageEvent, message=ImageMessage)
def handle_image(event):
    # reply_message():ユーザからのeventに対してレス
    # reply_tokenはwebhook event objectから
    print("orig type: " + event.message.type)
    print("image id: " + event.message.id)
    message_content = line_bot_api.get_message_content(event.message.id)
    face_image = Image.open(BytesIO(message_content.content))
    filename = '/tmp/' + event.message.id + '.jpg'
    print("content type: " + message_content.content_type)
    print(face_image.format, face_image.size, face_image.mode)
    face_image.save(filename)
    result = face_analysis(filename)
    print(os.path.abspath(filename))
    for idx in range(result['face_num']):
        img_rect = draw_img(result['faces'][idx], os.path.abspath(filename))
        # image_message = ImageSendMessage(
            # original_content_url="https://ifpythonlinebot.herokuapp.com" + filename,
            # preview_image_url="https://ifpythonlinebot.herokuapp.com" + filename,
        # )
        # line_bot_api.reply_message(event.reply_token, image_message)
        line_bot_api.reply_message(
            event.reply_token,
            TextSendMessage(text=str(createReslt(result['faces'][idx]))))
    if result['face_num'] == 0:
        line_bot_api.reply_message(
            event.reply_token,
            TextSendMessage(text='undetectable'))

def createReslt(face):
    gender = face['attributes']['gender']
    age = face['attributes']['age']
    emotion = face['attributes']['emotion']
    beauty = str(face['attributes']['beauty'])
    result = 'gender : ' + str(gender) + '\nage : ' + str(age) + '\nemotion : ' + str(emotion) + '\nbeauty : ' + beauty
    return result

def face_analysis(input_file):
    img_file = base64.encodebytes(open(input_file, 'rb').read())

    config = {'api_key' : os.environ['API_KEY'],
              'api_secret':os.environ['API_SECRET'],
              'image_base64':img_file,
              'return_attributes' : 'gender,age,smiling,headpose,facequality,blur,eyestatus,emotion,ethnicity,beauty,mouthstatus,eyegaze,skinstatus'
              }

    url = 'https://api-us.faceplusplus.com/facepp/v3/detect'

    response = requests.post(url, data = config)

    result = response.json()
    print(result['face_num'])
    for i in range(result['face_num']):
        print(result['faces'][i])
    return result

def draw_img(face, img):
    try:
        img = Image.open(img)
        draw = ImageDraw.Draw(img)
        left = face["face_rectangle"]["left"]
        top = face["face_rectangle"]["top"]
        right = left + face["face_rectangle"]["width"]
        bottom = top + face["face_rectangle"]["height"]
        # 矩形を描画
        draw.rectangle((left, top, right, bottom), outline = (0, 0, 255))
        print('draw successed')
    except Exception as e:
        print("in draw_img err")

    return img

if __name__ == "__main__":
#    app.run()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)