#!/usr/bin/env python3

from flask import Flask
from flask import render_template
# Run server on localhost:5000 to view current index.html
# and state_inequality.js
app = Flask(__name__)
@app.route("/")
def index():
    return render_template("/index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)