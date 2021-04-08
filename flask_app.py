from flask import Flask
app = Flask(__name__)

@app.route('/')
def main():
    head = open("index0.html").read()
    body = open("laser_macaroni.html").read()
    foot = open("index1.html").read()
    return head+body+foot

if __name__ == "__main__":
    app.run()