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
	client = MongoClient()
	db = client['vishal_projects'] #set database
	collection = db['crime'] #set collection
	"""
	want to get
	"""
	FIELDS = {
	'Jurisdiction of Compiled':True, 'Year': True,
	'Prison Population': True, 'Incarceration Rate': True,
	'Population': True, 'Violent crime total': True, 
	'Murder and nonnegligent Manslaughter': True,
	'Forcible rape':True, 'Robbery':True,
	'Aggravated assault':True, 'Property crime total':True,
	'Burglary':True, 'Larceny-theft':True, 'Motor vehicle theft':True,
	'Region':True, 'Incarceration Rate':True, 'State':True}

	json_hold = []
	documents = collection.find({}, FIELDS)
	for document in documents:
		json_hold.append(document)
	json_hold = json.dumps(json_hold, default = json_util.default)

	return json_hold


if __name__ == '__main__':
	app.run(host = '0.0.0.0', port = 5000, debug = True)


