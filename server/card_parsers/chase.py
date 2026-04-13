from card_parsers.base_parser import BaseParser

from bs4 import BeautifulSoup

import re

class Chase(BaseParser):
	def __init__(self):
		super().__init__("chase")

	def __chase_process_main(self, soup: BeautifulSoup, unused):
		result = []
		html_cards = soup.find_all("div", attrs={"data-card-id": re.compile(r"[A-Z]+")})

		if len(html_cards) == 0:
			return None

		for card in html_cards:
			res = {}
			res["provider"] = "chase"

			# name and details link
			res["name"] = ""
			res["details_link"] = ""
			if (name_button := card.find("a", attrs={"data-event-element-type": "LINK"})):
				if (url := name_button.get("href"))[0] == "/":
					url = "https://creditcards.chase.com" + url
				if (name := name_button.span.text):
					res["name"] = name
				res["details_link"] = url

			# image
			res["image"] = ""
			if (image := card.find("img", attrs={"data-nimg": "1"})):
				if (url := image.get("src"))[0] == "/":
					url = "https://creditcards.chase.com" + url
				res["image"] = url

			# application link
			res["application_link"] = ""
			if (app_btn := card.find("a", attrs={"data-event-action-outcome": "applyNow"})):
				if (url := app_btn.get("href"))[0] == "/":
					url = "https://secure.chase.com" + url
				res["application_link"] = url

			result.append(res)

		return result

	def __chase_process_card(self, soup: BeautifulSoup, result: dict) -> dict:
		keys = result.keys()

		if (error := soup.find("h2", text="Application error: a client-side exception has occurred while loading creditcards.chase.com (see the browser console for more information).")):
			raise "Error page provided"
		if (error := soup.find("h1", text="Access Denied")):
			raise "Access denied page provided"

		# page
		main = (soup.find("div", id=re.compile("^card-detail-.*")) or
			    soup.find("main", class_="main", id="main-content") or
				soup.find("main") or
				soup)

		result["page"] = str(self._clean_page_soup(main))

		# application link
		if (not "application_link" in keys) or (result["application_link"] == ""):
			if (app_btn := soup.find("a", class_="apply-now")):
				if (url := app_btn.get("href"))[0] == "/":
					url = "https://secure.chase.com" + url
				result["application_link"] = url

		# image (probably better res here)
		if (img := soup.find("img", attrs={"data-nimg": "1"})):
			if (img_src := img.get("src"))[0] == "/":
				img_src = "https://creditcards.chase.com" + img_src
			result["image"] = img_src

		return result


	def process(self) -> None|dict:
		cards = self.playwright_process("https://creditcards.chase.com/all-credit-cards", self.__chase_process_main)
		if cards is None or len(cards) == 0:
			# try one more time
			print("Playwright returned nothing, trying again")
			cards = self.playwright_process("https://creditcards.chase.com/all-credit-cards", self.__chase_process_main)
			if cards is None or len(cards) == 0:
				print("Playwright returned nothing again. Try again later.")
				return None
		
		cards_to_send = []
		for i in range(len(cards)-1, -1, -1):
			card = cards[i]
			if "details_link" in card.keys() and not (card["details_link"] == ""):
				cards_to_send.append(card)
				cards.pop(i)
		if cards_to_send is None or len(cards_to_send) == 0:
			return cards

		cards.extend(self.playwright_process(cards_to_send, self.__chase_process_card))
		return cards