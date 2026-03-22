from gemini import parse_unknown_attributes

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from zenrows import ZenRowsClient

import json
import re
import requests
import sys

def get_web_data(url: str, parser: str = "lxml") -> None|BeautifulSoup:
	response = requests.get(url)

	if not response.status_code == 200:
		return None

	return BeautifulSoup(response.content, parser)

def get_capital_one() -> list:
	cards = []
	card_names = {
		"credit-cards": ["bass-pro-shops", "cabelas", "club-business", "kohls", "platinum", "platinum-secured", "potterybarn", "quicksilver", "quicksilver-good-credit", "quicksilverone", "quicksilver-student", "quicksilver-secured", "rei", "savor", "savor-student", "savor-good-credit", "savorone", "thekeyrewards", "t-mobile", "venture", "venture-x", "ventureone", "ventureone-good-credit", "westelm", "williams-sonoma"],
		"small-business/credit-cards": ["spark-cash", "spark-cash-plus", "spark-cash-select", "spark-classic", "spark-miles", "spark-miles-select", "venture-x-business"]
	}

	for sub_url, sub_cards in card_names.items():
		for card_name in sub_cards:
			url = f'https://www.capitalone.com/{sub_url}/{card_name}'
			if not (soup := get_web_data(url)):
				print(f"Warning: could not pull data for: {card_name}")
				continue

			res = {}
			res["provider"] = "capital_one"
			res["details_link"] = url

			# name
			if (name := soup.find("h1", class_="product-name")):
				res["name"] = name.string

			# credit requirement
			if (credit := soup.find("a", class_="credit-link")):
				res["credit"] = credit.string

			# picture
			if (image := soup.find("img", class_="card-image")):
				res["image"] = image.get("src")

			# preapproval link
			res["preapproval_link"] = ""
			if (preapproval_button := soup.find(string=re.compile("[Pp]re-[Aa]pproved"))):
				if (link := preapproval_button.parent.get("href"))[0] == "/":
					link = "https://applynow.capitalone.com" + link
				res["preapproval_link"] = link

			# application link
			res["application_link"] = ""
			if (application_button := soup.find(string=re.compile("[Aa]pply [Nn]ow"))):
				res["application_link"] = application_button.parent.get("href")

			# page text
			res["page"] = ""
			if (page := soup.find("shared-cms-container-component", class_="ng-star-inserted")):
				res["page"] = page.get_text()


			cards.append(res)

	# TODO: bj's card has two on one page
	#url = "bjs-wholesale-club"

	return cards


def get_bank_of_america() -> list:
	cards = []

	soup = get_web_data("https://www.bankofamerica.com/credit-cards/#filter")

	# get card list
	max_json_len = 10000
	card_list = soup.find("div", class_="card-list")["data-jcr"]
	if len(card_list) < max_json_len:
		card_list = json.loads(card_list)
	
	urls = []
	for card in card_list.values():
		if (not type(card) == dict):
			break
		urls.append("https://www.bankofamerica.com/credit-cards/" + card["learnMore"]["path"] + "?campaign=" + card["campaign"])
	urls = list(set(urls))

	client = ZenRowsClient("c63ff661cea1c80cc05691d252994bc8399f6e83")
	params = {"mode": "auto"}
	for url in urls:
		new_soup = client.get(url, params=params)
		print(new_soup.text)
		return

		app_info = new_soup.find("div", id="apply-now-default")["data-jcr"]
		if len(app_info) < max_json_len:
			app_info = json.loads(app_info)
		print(app_info)
		return

		res = {}
		res["provider"] = "bank_of_america"
		res["details_link"] = url

		# name
		res["name"] = ""
		if (name := new_soup.find("h1", class_="heading title-heading")):
			name = re.sub(r"^Bank of America®?|Credit Card$", "", name.string).strip()

		# credit requirement
		if (credit := soup.find("a", class_="credit-link")):
			res["credit"] = credit.string

		# picture
		if (image := soup.find("img", class_="card-image small-centered")):
			res["image"] = image.get("src")

		# application link
		res["application_link"] = ""
		if (application_button := soup.find(string=re.compile("[Aa]pply [Nn]ow"))):
			res["application_link"] = application_button.parent.get("href")

		# preapproval link
		res["preapproval_link"] = ""
		if (preapproval_button := soup.find(class_="prequalify", id="preQualify_engagement", string=re.compile("[Pp]requalify"))):
			print("pre:", preapproval_button)
			if (link := preapproval_button.parent.get("href"))[0] == "/":
				link = "https://applynow.capitalone.com" + link
			res["preapproval_link"] = link

		# page text
		res["page"] = ""
		if (page := soup.find("div", id="details")):
			res["page"] = page.parent.get_text()

		cards.append(res)

	return cards

def get_wells_fargo():
	if not (soup := get_web_data("https://creditcards.wellsfargo.com/?sub_channel=SEO&vendor_code=G")):
		print("Error: could not get Wells Fargo credit card information")
		return
	#print(soup.prettify())

	urls = []
	cards = soup.find_all("div", class_="card border border-opacity-50 shadow")
	for card in cards:
		if not (page := card.div.div.div.div.a):
			print(f"Warning: could not pull data for: {card.get("data-group-name")}")
			continue
		urls.append("https://creditcards.wellsfargo.com" + page.get("href"))
	urls = list(set(urls))

	print(urls)
	for url in urls:
		new_soup = get_web_data(url)

		res = {}
		res["provider"] = "wells_fargo"
		res["details_link"] = url

		# name
		res["name"] = ""
		if (card_info := new_soup.find("div", class_="card-info")):
			res["name"] = card_info.p.string

		print(new_soup.prettify())

		# name
		return

	return

def get_chase(attempt=0):
	if not (soup := get_web_data("https://creditcards.chase.com/all-credit-cards")):
		if attempt < 10:
			get_chase(attempt+1)
		print("Error: could not get Chase credit card information")
		return

	#print(soup.prettify())

	urls = []
	cards = soup.find_all("a", attrs={"data-lh-name": "LearnMore"})
	
	if len(cards) == 0:
		if attempt < 10:
			return get_chase(attempt+1)

	for card in cards:
		urls.append("https://creditcards.chase.com" + card.get("href"))
	urls = list(set(urls))

	for url in urls:
		csoup = get_web_data(url)
		print(csoup.prettify())

		res = {}
		res["provider"] = "chase"
		res["details_link"] = url

		# name
		res["name"] = ""
		if (name := csoup.find("div", class_="cmp-personalcardsummary__title")):
			print("name ->", name)
			res["name"] = name.get_text()

		# preapproval
		res["preapproval_link"] = ""
		if (preapproval_button := csoup.find("div", class_="cmp-personalcardsummary__applywithcconfidence--button")):
			print("pre-ap ->", preapproval_button)
			res["preapproval_link"] = preapproval_button.get("href")
		
		# apply
		res["application_link"] = ""
		if (application_button := csoup.find("a", attrs={"data-lh-name": "ApplyNow", "class": "btn button button--applynow-guest icon-lock chaseanalytics-track-link"})):
			print("appl ->", application_button)
			res["application_link"]

		print(res)
		return
		if (card_info := new_soup.find("div", class_="card-info")):
			res["name"] = card_info.p.string

		print(new_soup.prettify())

		# name
		return


def main():
	load_dotenv()
	cards = get_chase()
	#cards = get_capital_one()
	#print(cards)
	return

	card_list = []
	i = 1
	for card in cards:
		card_list.append(parse_unknown_attributes(json.dumps(card, ensure_ascii=False)))

	print(json.dumps(card_list, ensure_ascii=False, indent=4))
	return
	
	#json = json.dumps(parse_unknown_attributes(cards), ensure_ascii=False)

	#cards = json.dumps(get_capital_one(), ensure_ascii=False)

	#return
	#print(json.dumps(parse_unknown_attributes(cards), indent=4, ensure_ascii=False))

if __name__ == "__main__":
	sys.exit(main())
	
