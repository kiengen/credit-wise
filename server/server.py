from gemini import parse_unknown_attributes

from bs4 import BeautifulSoup
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

import json
import re
import requests
import sys

def get_web_data(url: str) -> None|BeautifulSoup:
	response = requests.get(url)

	if not response.status_code == 200:
		return None

	return BeautifulSoup(response.content, 'lxml')

def get_capital_one() -> dict:
	cards = []

	if not (soup := get_web_data('https://www.capitalone.com/credit-cards/?filter=compareallcards')):
		return

	card_div = soup.find("section", class_="pfo-product-list ng-star-inserted")
	html_cards = card_div.find_all("card-pfo-product-list-item-desktop", class_="ng-star-inserted")
	for card in html_cards:
		response = {}
		response["provider"] = "capital_one"
		response["credit"] = card.find("div", class_="credit-link").string.split(" ")[0].lower()
		response["name"] = card.find("button", id=re.compile(r"^productNameText.*")).string
		response["image"] = card.find("button", class_="card-art").img.get("src")

		# application link
		response["application_link"] = ""
		if (application := card.find("a", attrs={"aria-label": "Apply Now"})) is not None:
			if (url := application.get("href").split(">")[-1])[0] == "/":
				url = "https://applynow.capitalone.com" + url
			response["application_link"] = url

		# preapproval link
		response["preapproval_link"] = ""
		if (preapproval := card.find("a", attrs={"aria-label": "See if I'm Pre-Approved"})) is not None:
			response["preapproval_link"] = "https://www.capitalone.com" + preapproval.get("href").split(">")[-1]

		# more details link
		response["details_link"] = ""
		if (details := card.find("a", attrs={"aria-label": "View Card Details"})) is not None:
			if (url := details.get("href").split(">")[-1])[0] == "/":
				url = "https://www.capitalone.com" + url
			response["details_link"] = url

		# attributes
		response["attrs"] = []
		if (attr_div := card.find("div", class_="attribute-list promo-ribbon-disabled ng-star-inserted")) is not None:
			attrs = attr_div.find_all("li")
			for i in range(len(attrs)):
				attrs[i] = attrs[i].contents[0].strip()
			response["attrs"] = attrs
		cards.append(response)

	return cards


def get_bank_of_america() -> dict:
	with sync_playwright() as p:
		browser = p.chromium.launch()
		page = browser.new_page()
		page.goto('https://www.bankofamerica.com/credit-cards/')
		page.wait_for_load_state('networkidle')
		html = page.inner_html('body')

		result = parse_unknown_attributes(html, multiple=True)

		for idx, card in enumerate(result["cards"]):
			if not card["details_link"]:
				continue

			print("doing", card['name'])
			page.goto(card["details_link"])
			page.wait_for_load_state('networkidle')
			detail_html = page.inner_html('body')
			result["cards"][idx] = parse_unknown_attributes(detail_html)

		browser.close()

	return result


def get_american_express() -> dict:
	with sync_playwright() as p:
		browser = p.chromium.launch()
		page = browser.new_page()
		page.goto('https://www.americanexpress.com/us/credit-cards/category/all/')
		# page.wait_for_load_state('networkidle')
		from time import sleep
		sleep(10)
		html = page.inner_html('body')

		result = parse_unknown_attributes(html, multiple=True)

		for idx, card in enumerate(result["cards"]):
			if not card["details_link"]:
				continue

			print("doing", card['name'])
			# page.goto(card["details_link"])
			# page.wait_for_load_state('networkidle')
			# detail_html = page.inner_html('body')
			# result["cards"][idx] = parse_unknown_attributes(detail_html)

		browser.close()

	return result

def get_wells_fargo(attempt=0):
	cards = []

	if not (soup := get_web_data("https://creditcards.wellsfargo.com/?sub_channel=SEO&vendor_code=G")):
		if attempt < 10:
			return get_wells_fargo(attempt+1)
		print("Error: could not get Wells Fargo credit card information")
		return

	urls = []
	html_cards = soup.find_all("div", class_="card border border-opacity-50 shadow")

	if len(html_cards) == 0 and attempt < 10:
		return get_wells_fargo(attempt+1)

	for card in html_cards:
		if not (page := card.div.div.div.div.a):
			print(f"Warning: could not pull data for: {card.get("data-group-name")}")
			continue

		if (page_name := page.get("href")):
			if page_name[0] == "/":
				page_name = "https://creditcards.wellsfargo.com/" + page.get("href")
			urls.append(page_name)

	urls = list(set(urls))

	with sync_playwright() as p:
		browser = p.chromium.launch()
		page = browser.new_page()
		for url in urls:
			page_attempt = 0
			soup = None
			while soup is None and page_attempt < 6:
				page.goto(url)
				page.wait_for_load_state('networkidle')
				html = page.inner_html('body')

				soup = BeautifulSoup(html, 'lxml').find("main", class_="main", id="main-content")
				page_attempt += 1
			if soup is None:
				print(f"Warning: could not pull data for: {url}")
				continue

			res = {}
			res["provider"] = "wells_fargo"
			res["details_link"] = url
			print("url ->", url)

			# name
			if (name := soup.find("h1")):
				res["name"] = name.get_text().strip().replace("\n", "")
				print('name ->', res["name"])

			# image
			if (image := soup.find("img", attrs={"data-name": "Art"})):
				if (image_name := image.get("src")) and image_name[0] == "/":
					image_name = "https://creditcards.wellsfargo.com" + image.get("src")
				res["image"] = image_name
				print("image ->", res["image"])

			# application link
			if (app := soup.find("a", attrs={"data-name": "ApplyNowSticky"}, string=re.compile("[Aa]pply now"))):
				res["application_link"] = app.get("href")
				print("app ->", res["application_link"])

			# annual fee
			if (ann_fee := soup.find("a", class_=re.compile(".*annualfee.*"))):
				if (ann_fee_content := ann_fee.content):
					ann_fee = ann_fee.content[0]
				res["annual_fee"] = re.sub("[ ]+", " ", ann_fee.string.strip().replace("\n", ""))
				print("af ->", res["annual_fee"])
			elif (ann_fee := soup.find(string=re.compile(r"^\$[\d]+ [Aa]nnual [Ff]ee$"))):
				res["annual_fee"] = re.sub("[ ]+", " ", ann_fee.string.strip().replace("\n", ""))
				print("af ->", res["annual_fee"])

			# page
			res["page"] = str(soup)

			cards.append(res)

	return cards

def get_chase(attempt=0):
	cards = []

	if not (soup := get_web_data("https://creditcards.chase.com/all-credit-cards")):
		if attempt < 10:
			get_chase(attempt+1)
		print("Error: could not get Chase credit card information")
		return

	urls = []
	html_cards = soup.find_all("a", attrs={"data-lh-name": "LearnMore"})
	
	if len(cards) == 0 and attempt < 10:
			return get_chase(attempt+1)

	for card in html_cards:
		urls.append("https://creditcards.chase.com" + card.get("href"))
	urls = list(set(urls))

	for url in urls:
		csoup = get_web_data(url)

		res = {}
		res["provider"] = "chase"
		res["details_link"] = url

		# name
		res["name"] = ""
		if (name := csoup.find("h1")):
			res["name"] = name.string

		# preapproval
		res["preapproval_link"] = ""
		if (preapproval_button := csoup.find("div", class_="cmp-personalcardsummary__applywithcconfidence--button")):
			#print("pre-ap ->", preapproval_button)
			res["preapproval_link"] = preapproval_button.get("href")

		# apply
		res["application_link"] = ""
		if (application_button := csoup.find("a", attrs={"data-lh-name": "ApplyNow", "class": "btn button button--applynow-guest icon-lock chaseanalytics-track-link"})):
			#print("appl ->", application_button)
			res["application_link"] = application_button.get("href")

		# page
		res["page"] = str(csoup.find("main"))

		if (res["page"] is None):
			continue

		cards.append(res)
	return cards

def main():
	load_dotenv()
	cards = get_wells_fargo()

	card_list = []
	for card in cards:
		card_list.append(parse_unknown_attributes(json.dumps(card, ensure_ascii=False)))

	with open('output.json', 'w') as f:
		json.dump(card_list, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
	sys.exit(main())
	
