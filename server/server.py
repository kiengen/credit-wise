from card_parsers.american_express import AmericanExpress
from card_parsers.bank_of_america import BankOfAmerica
from card_parsers.capital_one import CapitalOne
from card_parsers.chase import Chase
from card_parsers.wells_fargo import WellsFargo
from gemini import parse_unknown_attributes

from dotenv import load_dotenv
from time import sleep

import json
import os.path
import re
import sys

def main():
	load_dotenv()
	servers = [BankOfAmerica()]

	for server in servers:
		# Nice header
		print("========================")
		print(server.name)
		print("========================")

		# Get the processed credit card data from disk, if available
		prev_cards = []
		found_cards = None
		if os.path.isfile(f"./output_{server.name}.json"):
			print(f"Gemini processed cards found at output_{server.name}.json")
			with open(f'output_{server.name}.json', 'r') as f:
				prev_cards = json.load(f)
			print("Checking if there are new cards to add")

		# Get the credit card data, either saved locally, or by calling the services'
		# respective process() methods
		if os.path.isfile(f"./tmp_cards_{server.name}.json"):
			print(f"Cards loaded from tmp_cards_{server.name}.json")
			with open(f'tmp_cards_{server.name}.json', 'r') as f:
				found_cards = json.load(f)
		else:
			print("Loading cards...")
			found_cards = server.process()
			if found_cards is None or len(found_cards) == 0:
				print(f"Warning: No cards from {server.name}!")
				return
			# (save locally for next time)
			print(f"Saving cards to tmp_cards_{server.name}.json before processing...")
			with open(f'tmp_cards_{server.name}.json', 'w') as f:
				json.dump(found_cards, f, indent=2, ensure_ascii=False)

		# Remove any that have already been processed
		final_cards = []
		for card in prev_cards:
			for i in range(len(found_cards)-1, -1, -1):
				if card["name"] == found_cards[i]["name"]:
					print(f" > removed {card["name"]}, no need to reprocess")
					final_cards.append(found_cards[i])

		# Send any cards that still need to be processed to Gemini
		if len(found_cards) > 0:
			print("\nSending to Gemini for cleaning...")
			try:
				for card in found_cards:
					if (page_len := len(card["page"])) > 20000:
						print(f" > (Too big [{page_len}]: {card["name"]})")
						continue
					print(f" > {card["name"]}")
					new_card = parse_unknown_attributes(json.dumps(card, ensure_ascii=False))
					final_cards.append(new_card)
					sleep(4)
			except Exception as e:
				print(f"Error: Gemini: {e}")

				# save progress! reduce API calls needed
				with open(f'output_{server.name}.json', 'w') as f:
					json.dump(final_cards, f, indent=2, ensure_ascii=False)
				print(f"Processed cards written to output_{server.name}.json")
				return
		else:
			print(f"No new cards to be processed! output_{server.name}.json left untouched")
			return

		# (save locally for next time)
		print(f"Writing to output_{server.name}.json...")
		with open(f'output_{server.name}.json', 'w') as f:
			json.dump(final_cards, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
	sys.exit(main())
	
