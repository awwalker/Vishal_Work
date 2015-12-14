#!/usr/bin/env python3
"""
SET UP SITE
"""

from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json
from bson import json_util
from bson.json_util import dumps

app = Flask(__name__)

@app.route("/")
def index():
	return render_template("index.html")

@app.route("/vishal/crime")
def projects():
	client = MongoClient() #initialize mongo connection
	db = client['vishal_work'] #set database
	collection = db['crime'] #set collection
	"""
	want to get only these fields...focus is on RATES not just raw NUMBERS
	Should make charts/graphs clearer to read...values are out of 100,000
	"""
	FIELDS = {
	'Year': True,
	'State':True,
	#'Prison Population': True,
	#'Population': True,
	'Incarceration Rate': True,
	'Region':True,
	'Violent Crime Rate':True,
	'Murder/Manslaughter Rate':True,
	'Rape Rate':True,
	'Robbery Rate':True,
	'Aggravated Assault Rate': True,
	'Property Crime Rate': True,
	'Burglary Rate':True,
	'Larceny Rate':True,
	'Motor Vehicle Theft Rate': True,
	}

	json_hold = []
	documents = collection.find({}, FIELDS)
	for document in documents:
		json_hold.append(document)
		print(type(document['Rape Rate']))
	json_hold = json.dumps(json_hold, default = json_util.default)

	return json_hold


if __name__ == '__main__':
	app.run(host = '0.0.0.0', port = 5000, debug = True)
