from card_parsers.base_parser import BaseParser

from bs4 import BeautifulSoup

import re

class AmericanExpress(BaseParser):
	def __init__(self):
		super().__init__("american_express")

	def __american_express_process_main(self, soup: BeautifulSoup, unused):
		print(soup.prettify())
		return None

	def __american_express_process_card(self, soup: BeautifulSoup, result: dict) -> dict:
		keys = result.keys()

		# page
		main = (soup.find("main", class_="main", id="main-content") or
				soup.find("main") or
				soup.find("shared-cms-container-component", class_="ng-star-inserted"))# or
				#soup)

		# delete some unnecessary/large blocks

		result["page"] = str(self._clean_page_soup(main))

		# application link
		if (not "application_link" in keys) or (result["application_link"] == ""):
			pass

		# preapproval link
		if (not "preapproval_link" in keys) or (result["preapproval_link"] == ""):
			pass

		# image (probably better res here)
		if (img := soup.find("img", class_="card-image")):
			pass

		return result


	def process(self) -> None|dict:
		cards = self.playwright_process("https://www.americanexpress.com/us/credit-cards/category/all/", self.__american_express_process_main)
		if cards is None or len(cards) == 0:
			return None

		return None#cards