from pathlib import Path

from flask import Flask, request, jsonify, render_template
from flask_limiter import Limiter
from gevent import monkey
from gevent.pywsgi import WSGIServer
monkey.patch_all()

from configparser import ConfigParser
from pdfbot import PDFBot


app = Flask(__name__, static_url_path='/static', static_folder='static')

config = ConfigParser()
config.read('config.ini')

limiter = Limiter(
    app,
    storage_uri='memory://'
)

bot = PDFBot()



@app.route("/")
def home():
    return render_template("index.html")  # Serve the index.html template

@limiter.limit("10 per hour")
@app.route("/generate-response", methods=["POST"])
def generate_bot_response():
    user_message = request.json.get("user_message")
    response = bot.generate_response(user_message)
    return jsonify({"response": response})

@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    file = request.files["pdf"]
    if file and file.filename.endswith(".pdf"):
        savefile="uploads/" + file.filename
        if not Path(savefile).exists():       
            file.save(savefile)
        bot.prepare_pdf(file.filename)
        return jsonify({"success": True, "filename": file.filename})
    return jsonify({"success": False, "message": "Invalid file format"})

@app.route("/clear-messages", methods=["POST"])
def clear_messages():
    bot.clear_messages()
    return jsonify({"success": True, "message": "Chat messages cleared"})

@app.route("/clear-pdf-info", methods=["POST"])
def clear_pdf_info():
    bot.clear_pdf_info()
    return jsonify({"success": True, "message": "PDF info cleared"})


if __name__ == "__main__":
    host="localhost"
    portNum=5000
    print(f"{host}:{portNum}")
    http_server = WSGIServer((host, portNum), app)
    
    http_server.serve_forever()
