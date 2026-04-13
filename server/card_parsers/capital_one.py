from card_parsers.base_parser import BaseParser

from bs4 import BeautifulSoup

import re

class CapitalOne(BaseParser):
	def __init__(self):
		super().__init__("capital_one")

	def __capital_one_process_main(self, soup: BeautifulSoup, unused):
		card_div = soup.find("section", class_="pfo-product-list ng-star-inserted")
		html_cards = card_div.find_all("card-pfo-product-list-item-desktop", class_="ng-star-inserted")
		result = []
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

			result.append(response)
		return result

	def __capital_one_process_card(self, soup: BeautifulSoup, result: dict) -> dict:
		keys = result.keys()

		# page
		main = (soup.find("main", class_="main", id="main-content") or
				soup.find("main") or
				soup.find("shared-cms-container-component", class_="ng-star-inserted") or
				soup)

		# delete some unnecessary/large blocks
		if (delete_me := main.find("iframe", attrs={"aria-label": "disclosure"})):
			delete_me.decompose()
		if (delete_me := main.find("card-svg-loader")):
			delete_me.decompose()
		if (delete_me := main.find("card-nav-menu", class_="ng-star-inserted")):
			delete_me.decompose()

		result["page"] = str(self._clean_page_soup(main))

		# application link
		if (not "application_link" in keys) or (result["application_link"] == ""):
			url = ""
			if (app_btn := soup.find("a", class_="apply-btn")):
				if (url := app_btn.get("href"))[0] == "/":
					url = "https://www.capitalone.com" + url

		# preapproval link
		if (not "preapproval_link" in keys) or (result["preapproval_link"] == ""):
			url = ""

		# image (probably better res here)
		if (img := soup.find("img", class_="card-image")):
			if (img_src := img.get("src"))[0] == "/":
				img_src = "https://ecm.capitalone.com" + img_src
			result["image"] = img_src

		return result


	def process(self) -> None|dict:
		cards = self.playwright_process("https://www.capitalone.com/credit-cards/?filter=compareallcards", self.__capital_one_process_main)
		if cards is None or len(cards) == 0:
			return None

		cards_to_send = []
		for i in range(len(cards)-1, -1, -1):
			card = cards[i]
			if "details_link" in card.keys() and not (card["details_link"] == ""):
				cards_to_send.append(card)
				cards.pop(i)
		if cards_to_send is None or len(cards_to_send) == 0:
			return cards

		cards.extend(self.playwright_process(cards_to_send, self.__capital_one_process_card))
		return cards