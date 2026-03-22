from google import genai
from pydantic import BaseModel, Field
from enum import Enum
from os import getenv

Providers: list = [
	"capital_one",
	"american_express",
	"chase",
	"citi",
	"bank_of_america",
	"discover",
	"wells_fargo",
	"amazon",
	"united"
]

Networks: list = [
	"mastercard",
	"visa",
	"amex",
	"discover"
]

# TODO: see which values are commonly used
class Credit(Enum):
	none = 0
	poor = 1
	fair = 2
	good = 3
	excellent = 4

class CreditCard(BaseModel):
	name: str = Field(description="The name of the credit card")
	provider: str = Field(description="The company who is offering the credit card", enum=Providers)
	network: str = Field(description="The network which the card is on", enum=Networks)
	credit: str = Field(description="The credit score required/recommended to obtain the card")
	annual_fee: float = Field(description="The annual cost of keeping the card after any trial periods/sign on bonuses have passed")
	etc_pct: float = Field(description="Cash back on all purchases (general/non-categorical) as a percentage", minimum=0, maximum=1)
	has_ftf: bool = Field(description="Whether the card has foreign transaction fees or not, or if unknown, yes")
	image: str = Field(description="The URL to an image of the credit card")
	preapproval_link: str = Field(description="The URL to the official page where one can get preapproved for the card")
	application_link: str = Field(description="The URL to the official page where one can get apply for the card")
	details_link: str = Field(description="The URL to the official page where one can find more information about the card")
	other: list[str] = Field(description="Any other relevant information about the card provided as a list of strings")

class CardList(BaseModel):
	cards: list[CreditCard] = Field(description="A list of credit cards objects")

def parse_unknown_attributes(data: str) -> str:
	client = genai.Client()

	prompt = r"""
	Role & Context
	I want you to act as an expert Data Engineer. I have raw data scraped from Capital One that is currently unstructured and "dirty." My goal is to categorize this into a dictionary of relevant,  clean, analysis-ready data.

	The Data Sample
	Here is a representative sample of the raw data:
	{
		"provider": "capital_one",
		"credit": "good-excellent",
		"name": "BJ’s One™ Mastercard®",
		"image": "https://ecm.capitalone.com/WCM/card/products/www-bj-one-mc-240x151.png",
		"application_link": "https://applynow.capitalone.com/apply/partner/bjs/uns/member-validation/",
		"preapproval_link": "https://www.capitalone.com/apply/partner/bjs/uns/preapprove/member-validation/",
		"details_link": "",
		"attrs": ["$0 annual fee", "3% back in rewards on most purchases at BJ’s", "1.5% back in rewards on purchases everywhere else Mastercard® is accepted", "10¢ off/gallon at BJ’s Gas®"]
	}

	An example of the output for the provided data would be:
	{
		"provider": "capital_one",
		"credit": "good-excellent",
		"name": "BJ’s One™ Mastercard®",
		"image": "https://ecm.capitalone.com/WCM/card/products/www-bj-one-mc-240x151.png",
		"application_link": "https://applynow.capitalone.com/apply/partner/bjs/uns/member-validation/",
		"preapproval_link": "https://www.capitalone.com/apply/partner/bjs/uns/preapprove/member-validation/",
		"details_link": "",
		"annual_fee": 0,
		"has_ftf": true,
		"etc_pct": 0.015,
		"network": "mastercard",
		"other": ["3% back in rewards on most purchases at BJ’s", "10¢ off/gallon at BJ’s Gas®"]

	Please apply the following logic:
	The point of the other category is to provide a space for other benefits that do not fall within any of the existing categories. When we see common parameters cropping up in the attrs, we will consider adding them as additional parameters of the main object.
	In essence, it is to field and monitor future parameters, while still displaying the additional benefits to the users.
	Remove an attr if and only if its data has been completely conveyed through other fields. For example, with "1.5% back in rewards on purchases everywhere else Mastercard® is accepted", we added the network Mastercard and the 0.015 general cash back percentage, so all info was conveyed and it can be removed.
	Data Normalization: [e.g., Strip whitespace, remove symbols like $ or %, and in general ensure that standardized data processing is possible]
	Edge Cases: [e.g., If any fees/benefits are applied for the first few years only, use the general case and add the bonus information as an attr]

	Output Format
	Please provide an array of Attribute objects in a json.dumps format.

	Here is the data:

	""" + data

	response = client.models.generate_content(
	    model="gemini-3-flash-preview",
	    contents=prompt,
	    config={
	        "response_mime_type": "application/json",
	        "response_json_schema": CardList.model_json_schema(),
	    },
	)

	gemini_result = CardList.model_validate_json(response.text)
	return gemini_result.model_dump()


	result = []

	# convert credit card objects into json serializable dicts
	for card in gemini_result:
		result.append(vars(card))

	return result