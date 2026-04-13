from card_parsers.base_parser import BaseParser

from bs4 import BeautifulSoup

import re

class WellsFargo(BaseParser):
	def __init__(self):
		super().__init__("wells_fargo")

	def __wells_fargo_process_main(self, soup: BeautifulSoup, unused):
		html_cards = soup.find_all("div", attrs={"data-card-name": re.compile("^[a-z]+$")})
		result = []
		for card in html_cards:
			response = {}
			response["provider"] = "wells_fargo"
			
			# name
			if (card_info := card.find("h2", class_="product-name")):
				response["name"] = card_info.text
			elif (card_info := card.find("div", class_="card_name")):
				if (name := card.h2):
					parts = [
						t for t in name.find_all(string=True)
						if not t.find_parent(attrs={"aria-hidden": "true"})
					]
					response["name"] = "".join(parts)

			# image
			if (image := card.find("img", attrs={"data-name": "ArtMulticard"})) is not None:
				if (img_src := image.get("src", ""))[0] == "/":
					img_src = "https://creditcards.wellsfargo.com" + img_src
				response["image"] = img_src

			# annual fee
			if (ann_fee := card.find("a", attrs={"aria-label": re.compile(r"\$\d+ [Aa]nnual [Ff]ee")})):
				match = re.search(r'\$(\d+) [Aa]nnual [Ff]ee', ann_fee.get("aria-label", ""))
				response["annual_fee"] = match.group(1)

			# application link
			if (app_btn := card.find("a", class_="apply-now-link", attrs={"data-name": "ApplyNowMulticard"})) is not None:
				if (app_link := app_btn.get("href", ""))[0] == "/":
					app_link = "https://apply.wellsfargo.com" + app_link
				response["application_link"] = app_link

			# more details link
			if (details_btn := card.find("a", class_="learn-more", attrs={"data-name": "LearnMore"})) is not None:
				if (details_link := details_btn.get("href", ""))[0] == "/":
					details_link = "https://creditcards.wellsfargo.com" + details_link
				response["details_link"] = details_link

			result.append(response)
		return result

	def __wells_fargo_process_card(self, soup: BeautifulSoup, result: dict) -> dict:
		keys = result.keys()

		# page
		main_child = (soup.find("span", id="OverviewOffset") or
					  soup.find("section", class_="jumbotron") or
					  soup.find("section", id="calculator") or
					  soup.find("span", id="FeaturesBenefitsOffset"))
		main = main_child.parent if main_child else soup

		# delete some unnecessary/large blocks
		if (delete_me := main.find("section", id="props", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="props", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", id="footerOD", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="footerOD", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", id="sticky-banner", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="sticky-banner", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="exclusives", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="disclosures")):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="features", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="cards-selection", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="card-chart", recursive=False)):
			delete_me.decompose()
		if (delete_me := main.find("section", class_="choice-hotels", recursive=False)):
			delete_me.decompose()
		if (delete_mes := main.find_all("div", attrs={"aria-hidden": "true"})):
			for delete_me in delete_mes:
				delete_me.decompose()
		if (delete_mes := main.find_all("div", role="dialog")):
			for delete_me in delete_mes:
				delete_me.decompose()

		# page
		result["page"] = self._clean_page_string(str(self._clean_page_soup(main)))

		# application link
		if (not "application_link" in keys) or (result["application_link"] == ""):
			if (app_btn := main.find("a", class_="apply-now-link")):
				if (app_link := app_btn.get("href", ""))[0] == "/":
					app_link = "https://apply.wellsfargo.com" + app_link
				result["application_link"] = app_link

		# image (probably better res here)
		if (img := soup.find("img", attrs={"data-name": "Art"})):
			if (img_src := img.get("src", ""))[0] == "/":
				img_src = "https://creditcards.wellsfargo.com" + img_src
			result["image"] = img_src

		return result


	def process(self) -> None|dict:
		cards = self.curl_process("https://creditcards.wellsfargo.com/?sub_channel=SEO&vendor_code=G", self.__wells_fargo_process_main)
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

		cards.extend(self.playwright_process(cards_to_send, self.__wells_fargo_process_card))
		return cards