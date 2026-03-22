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

		result = parse_unknown_attributes(html)

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
	pass


def main():
	load_dotenv()
	cards = get_bank_of_america()
	with open('output.json', 'w') as f:
		json.dump(cards, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
	sys.exit(main())
	
