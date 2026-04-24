from bs4 import BeautifulSoup, Comment, NavigableString, Tag
from playwright.sync_api import sync_playwright
from time import sleep

import re
import requests

class BaseParser:
	def __init__():
		self.__num_retries = 3

	def __init__(self, name: str):
		self.name = name
		self.__num_retries = 3

	# implementation specified by child classes
	def process(self) -> None|list:
		pass

	def curl_process(self, url: str, curl_parse_soup) -> None|list:
		result = []

		soup = None
		page_attempts_left = self.__num_retries
		while True:
			try:
				soup = self.curl_get_soup(url)
			except Exception as e:
				print(f"Warning: cURL: Could not fetch: {e} Retrying ({page_attempts_left} left)...")
				sleep(0.3)

			page_attempts_left -= 1
			if (not soup is None) or page_attempts_left == 0:
				break
			print(f"Warning: BeautifulSoup: Could not process page. Retrying ({page_attempts_left} left)...")
			sleep(0.5)
		if not soup:
			print(f"Warning: Could not fetch page '{url}'.")
			return None

		# parse soup using provided method
		return curl_parse_soup(soup, result)

	"""!
	@brief Uses cURL to fetch web data from the provided URL
	@details Attempts to fetch and parse the HTML content at the provided URL
	@param url The URL from which to fetch the data
	@return The BeautifulSoup of the web page, or None if unsuccessful
	"""
	def curl_get_soup(self, url: str) -> None|BeautifulSoup:
		try:
			response = requests.get(url)
		except Exception as e:
			raise e

		if not response.status_code == 200:
			raise f"Status code {response.status_code}."

		return BeautifulSoup(response.content, 'lxml')

	"""!
	@brief Uses Playwright to fetch web data from the provided URL(s)
	@details Attempts to fetch and process web data from a provided set of data
	@param urls A list containing strs or dicts, or a single str/dict, containing exactly a URL or a credit card dict
	@return A credit card dict or list of credit card dicts (if provided a list)
	"""
	def playwright_process(self, urls: str|dict|list, playwright_parse_soup) -> dict|list:
		result = []

		# only returns a list if it is provided a list
		if not (return_list := isinstance(urls, list)):
			urls = [urls]

		with sync_playwright() as p:
			browser = p.chromium.launch()
			page = browser.new_page()

			# number of times it will retry a full page after receiving
			# and parsing the soup (if served invalid page content)
			global_retries = 2

			i = 0
			while i < len(urls):
				url = urls[i]

				# handles dict-like items
				curr_val = url
				if isinstance(curr_val, dict):
					url = url["details_link"]

				page_attempts_left = self.__num_retries
				soup = None
				while True:
					# navigate to desired page with playwright
					try:
						page_attempts_left -= 1
						page.goto(url, timeout=10000)
						page.wait_for_load_state('networkidle', timeout=5000)
					except Exception as e:
						if (page_attempts_left == 0):
							break
						print(f"Warning: Playwright: Could not fetch: {e} Retrying ({page_attempts_left} left)...")
						sleep(0.3)

					# process page's html content
					html = page.inner_html('body')
					soup = BeautifulSoup(html, 'lxml')
					if (not soup is None) or (page_attempts_left == 0):
						break
					print(f"Warning: BeautifulSoup: Could not process page. Retrying ({page_attempts_left} left)...")
					sleep(0.5)
				
				# give up; continue with next URL
				if soup is None:
					print(f"Warning: Could not process page '{url}'.")
					i += 1
					continue

				# parse soup using provided method
				parse = None
				#try:
				parse = playwright_parse_soup(soup, curr_val)
				"""except Exception as e:
					# try again if it raises an error
					print(f"Encountered error: {e}")
					if global_retries > 0:
						global_retries -= 1
						continue"""
					
				result.append(parse)
				i += 1

			browser.close()

		if not return_list:
			return result[0]

		return result

	"""!
	@brief Identifies whether the element is one that should be removed
	@details When saving the HTML content of the page to the card dict, it should be as trim as possible, so unhelpful Tags should be removed
	@param element The element to check
	@return False if the element is possibly helpful for understanding the HTML structure/content, else True
	"""
	def __is_unclean_element(self, element: BeautifulSoup) -> bool:
		if isinstance(element, Comment):
			return True
		if isinstance(element, NavigableString):
			return False
		if element.name == "style":
			return True
		if element.name == "link":
			return False
		if len(element.contents) == 0 and len(element.text) == 0:
			return True
		if (hidden := element.get("aria-hidden", False)) and hidden == "true":
			return
		return False

	"""!
	@brief Identifies whether the class member is one that should be removed
	@details Many class members are solely present for rendering/styling purposes and contribute nothing to understanding the card described on the page
	@param member The "word" in the class name to check
	@return False if the class member is possibly helpful for understanding the HTML structure/content, else True
	"""
	def __is_bad_class_member(self, member: str) -> bool:
		bad_class_substrs = ["border", "col", "container", "flex", "grid", "lg:", "margin", "md:", "ng", "offset", "padding", "rounded", "row", "shadow", "sm:", "span", "wrapper"]
		bad_class_prefixes = ["[", "!", "*", "aem-", "after:", "align-", "b-", "before:", "bg-", "carousel", "d-", "font-", "gap-", "h-", "hover:", "icon-", "inline-", "justify-", "left-", "lg:", "ng", "sm:", "m-", "max-h-", "max-w-", "mb-", "md:", "ml-", "mr-", "mt-", "mx-", "my-", "p-", "pb-", "pl-", "pr-", "pt-", "px-", "py-", "text-", "top-", "tw:", "w-"]
		bad_class_full = ["absolute", "active", "block", "disabled", "hidden", "hide-for-large-up", "inline", "lowercase", "overflow-hidden", "relative", "rounded", "rte", "show-for-large-up", "sr-only", "text-center", "underline", "uppercase", "visually-hidden"]
		bad_class_regex = [r"small-\d+", r"medium-\d+", r"large-\d+", r"large-push-\d+"]

		for substr in bad_class_substrs:
			if substr in member:
				return True
		for prefix in bad_class_prefixes:
			if member.startswith(prefix):
				return True
		for string in bad_class_full:
			if member == string:
				return True
		for regex in bad_class_regex:
			if re.fullmatch(regex, member):
				return True
		return False

	"""!
	@brief Attempts to create as trim a version of the BeautifulSoup as possible
	@details In applications where text length matters, it may be helpful to be able to remove uneccessary content from HTML trees
	@param soup The head of the BeautifulSoup tree to clean
	@return The cleaned head of the tree
	"""
	def _clean_page_soup(self, soup: BeautifulSoup) -> BeautifulSoup:
		# remove comments, empty divs, etc
		for d in soup.descendants:
			# checks parents first -> parent may now be "unclean"
			# so we must re-check it
			while self.__is_unclean_element(d):
				parent = d.parent
				d.decompose()
				d = parent

		# clean the class attribute
		for group in (soup.descendants, [soup]):
			for d in group:
				if not isinstance(d, Tag):
					continue
				if not (class_members := d.get("class", False)):
					continue
				for i in range(len(class_members)-1, -1, -1):
					if self.__is_bad_class_member(class_members[i]):
						class_members.pop(i)
					elif class_members[i] in class_members[i+1:]:
						class_members.pop(i)
				d["class"] = class_members

		# pare down on the attributes
		good_attrs = ["class", "href", "src", "id", "aria-label"]
		for group in (soup.descendants, [soup]):
			for d in group:
				if not isinstance(d, Tag):
					continue
				new_attrs = {}
				for attr in d.attrs.keys():
					if attr in good_attrs:
						if attr == "href" or attr == "src":
							if (length := len(d[attr])) > 300 or length == 0:
								continue
							if not (d[attr][:4] == "http" or d[attr][0] == "/"):
								continue
						if (not attr == "class") or (not len(d.attrs[attr]) == 0):
							new_attrs[attr] = d.attrs[attr]
				d.attrs = new_attrs

				# single child divs/spans
				single_child = ["div", "span", "strong", "sup", "section"]
				if d.name in single_child:
					if new_attrs == {} and len((d.contents)) == 1:
						d.unwrap()

		return soup

	def _clean_page_string(self, string: str) -> str:
		string = re.sub(r"\n[\t]+", "", string)
		string = re.sub(r"\n[ ]+", " ", string)
		string = re.sub(r"[ ]+", " ", string)
		string = re.sub(r">[ |\n|\t]*", ">", string)
		string = re.sub(r"[ |\n]*<", "<", string)
		return string

	def _clean_page(self, page: BeautifulSoup) -> str:
		return self._clean_page_string(str(self._clean_page_soup(page)))

	def _check_card(self, card: dict) -> dict:
		keys = set(card.keys())

		# Required fields
		if not "name" in keys:
			raise("Card missing name!")
		keys.remove("name")

		if not "provider" in keys or card["provider"] == "":
			raise(f"Card '{name}' missing provider!")
		keys.remove("provider")

		if not "network" in keys or card["network"] == "":
			raise(f"Card '{name}' missing network!")
		keys.remove("network")

		if not "credit" in keys or card["credit"] == "":
			raise(f"Card '{name}' missing credit!")
		keys.remove("credit")

		if not "annual_fee" in keys or card["annual_fee"] == -1:
			raise(f"Card '{name}' missing annual fee!")
		keys.remove("annual_fee")

		if not "cash_back" in keys or len(card["cash_back"]) == 0:
			raise(f"Card '{name}' missing cash back!")
		keys.remove("cash_back")

		if not "apr" in keys or card["apr"] == -1:
			raise(f"Card '{name}' missing cash back!")
		keys.remove("cash_back")

		if not "details_link" in keys or card["details_link"] == "":
			raise(f"Card '{name}' missing link to card!")
		keys.remove("details_link")

		if not "reward_type" in keys or card["reward_type"] == "":
			raise(f"Card '{name}' missing reward type!")
		keys.remove("reward_type")

		# It's fine if these ones aren't there
		if not "has_ftf" in keys:
			card["has_ftf"] = True
		else:
			keys.remove("has_ftf")

		if "image" in keys:
			keys.remove("image")

		if "preapproval_link" in keys:
			keys.remove("preapproval_link")

		if "application_link" in keys:
			keys.remove("application_link")

		if not "bonus" in keys:
			card["bonus"] = []
		else:
			keys.remove("bonus")

		if not "other" in keys:
			card["other"] = []
		else:
			keys.remove("other")

		# Extra/unexpected fields?
		if not len(keys) == 0:
			raise(f"Unexpected keys: {keys}")

		return card