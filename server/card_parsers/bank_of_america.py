from card_parsers.base_parser import BaseParser

from bs4 import BeautifulSoup

import re

class BankOfAmerica(BaseParser):
	def __init__(self):
		super().__init__("bank_of_america")

	def __bank_of_america_process_main(self, soup: BeautifulSoup, unused):
		cards_container = soup.find("div", id="allCardsPanel")
		if cards_container is None:
			raise "Main page missing cards or unexpected main page format"
		html_cards = cards_container.find_all("div", class_="row", attrs={"aria-hidden": "false"})
		result = []
		for card in html_cards:
			response = {}
			response["provider"] = "bank_of_america"
			
			# name and more details link
			if (card_info := card.find("a", class_="learn")):
				response["name"] = card_info.text.strip()
				last_newln = response["name"].rfind("\n")
				response["name"] = response["name"][last_newln+1:]
				if (url := card_info.get("href", ""))[0] == "/":
					url = "https://www.bankofamerica.com" + url
				response["details_link"] = url

			# image
			if (image := card.find("img", role="presentation")) is not None:
				if not ((img_src := image.parent).name == "source"):
					img_src = image_src.content[0]
				if (url := img_src.get("srcset", ""))[0] == "/":
					url = "https://www.bankofamerica.com" + url
					response["image"] = url

			# annual fee and ftf
			if (benefits := card.find("p", class_="benefits")):
				if (fee := re.search(r'([Nn]o|\d+) [Aa]nnual [Ff]ee', benefits.text).group(1)).lower() == "no":
					fee = "0"
				response["annual_fee"] = fee
				response["has_ftf"] = not ('no foreign transaction fees' in benefits.text)

			# application link
			if (app_btn := card.find("a", class_="apply", attrs={"data-name": "ApplyNowMulticard"})) is not None:
				if (app_link := app_btn.get("href", ""))[0] == "/":
					app_link = "https://www.bankofamerica.com" + app_link
				response["application_link"] = app_link

			result.append(response)
		return result

	def __bank_of_america_process_card(self, soup: BeautifulSoup, result: dict) -> dict:
		keys = result.keys()

		# page
		main = (soup.find("div", id="top"))

		if main is None:
			return

		# delete some unnecessary/large blocks
		if (delete_mes := main.find_all("script")):
			for delete_me in delete_mes:
				delete_me.decompose()
		if (delete_mes := main.find_all("a", class_="spa-boa-tnc-window")):
			for delete_me in delete_mes:
				delete_me.decompose()
		if (delete_mes := main.find_all("div", class_="error")):
			for delete_me in delete_mes:
				delete_me.decompose()
		if (delete_mes := main.find_all("style")):
			for delete_me in delete_mes:
				delete_me.decompose()
		if (delete_me := main.find("div", id="apply-now-default", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("div", id="semanticMarkupModule", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("div", class_="global-social-module")):
			delete_me.decompose()
		if (delete_me := main.find("div", class_="global-footer-module")):
			delete_me.decompose()
		if (delete_me := main.find("div", class_="appointment")):
			delete_me.decompose()
		if (delete_me := main.find("div", id="zipCodeGatingModalModule")):
			delete_me.decompose()
		if (delete_me := main.find("nav", id="navigation")):
			delete_me.decompose()
		if (delete_me := main.find("div", class_="header__default").parent):
			delete_me.decompose()
		if (delete_me := main.find("div", class_="connect-with-cc-module")):
			delete_me.decompose()
		if (delete_me := main.find("div", class_="spa-tab--navigation")):
			delete_me.decompose()
		if (delete_me := main.find("div", id="additional-benefits")):
			delete_me.decompose()
		if (delete_me := main.find("div", id="modalcardUnavailable")):
			delete_me.decompose()
		if (delete_me := main.find("div", id="rewardsCalcCcModule")):
			delete_me.decompose()


		# page
		result["page"] = self._clean_page(main)

		# preapproval link
		if (preap_btn := main.find("a", class_="prequalify")):
			if (preap_link := preap_btn.get("href", ""))[0] == "/":
				preap_link = "https://secure.bankofamerica.com" + preap_link
			result["preapproval_link"] = preap_link

		# application link
		if (app_btn := main.find("a", class_="apply")):
			if (app_link := app_btn.get("href", ""))[0] == "/":
				app_link = "https://secure.bankofamerica.com" + app_link
			result["application_link"] = app_link

		return result


	def process(self) -> None|dict:
		cards = self.playwright_process("https://www.bankofamerica.com/credit-cards/#filter", self.__bank_of_america_process_main)
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

		cards.extend(self.playwright_process(cards_to_send, self.__bank_of_america_process_card))
		return cards