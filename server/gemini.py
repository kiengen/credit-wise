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
	"united",
	"other"
]

Networks: list = [
	"mastercard",
	"visa",
	"amex",
	"discover",
	"other"
]

CashBackType: list = [
	"cash",
	"points"
]

# TODO: see which values are commonly used
class Credit(Enum):
	none = 0
	poor = 1
	fair = 2
	good = 3
	excellent = 4


class Bonus(BaseModel):
	bonus: float = Field(description="The monetary value of the bonus")
	min_spend: float = Field(description="The minimum spending required to earn the bonus")
	description: str = Field(description="A brief description of the bonus")
	is_welcome: bool = Field(description="Whether this is a welcome/sign-up bonus")
	bonus_type: str = Field(description="The type of bonus (e.g. cash, points)", enum=CashBackType)

class CreditCard(BaseModel):
	name: str = Field(description="The name of the credit card")
	provider: str = Field(description="The company who is offering the credit card", enum=Providers)
	network: str = Field(description="The network which the card is on", enum=Networks)
	credit: str = Field(description="The credit score required/recommended to obtain the card")
	annual_fee: float = Field(description="The annual cost of keeping the card after any trial periods/sign on bonuses have passed")
	cash_back: dict[str, float] = Field(description="Dictionary with different categories as keys and the cash back percentage (value / 100) as the values. For general cash back ('on all other purchases'), 'other' should be used). THE MAX VALUE SHOULD BE 1.")
	cash_back_type: str = Field(description="Specifies what the cashback will get you", enum=CashBackType)
	apr: float = Field(description="General Annual Percentage Rate (not intro APR) for the card", minimum=0, maximum=100)
	has_ftf: bool = Field(description="Whether the card has foreign transaction fees or not. If it is not specified, true")
	image: str = Field(description="The URL to an image of the credit card")
	preapproval_link: str = Field(description="The URL to the official page where one can get preapproved for the card")
	application_link: str = Field(description="The URL to the official page where one can get apply for the card")
	details_link: str = Field(description="The URL to the official page where one can find more information about the card")
	bonus: list[Bonus] = Field(description="Any additional perks that can be redeemed one time after being granted the credit card")
	other: list[str] = Field(description="Any other relevant information about the card provided as a list of strings")
	reward_type: str = Field(description="The type of reward the card offers (e.g. cash, points)", enum=CashBackType)

class CardList(BaseModel):
	cards: list[CreditCard] = Field(description="A list of credit cards objects")

def parse_unknown_attributes(data: str, multiple: bool = False) -> str:
	client = genai.Client()

	schema = CardList.model_json_schema() if multiple else CreditCard.model_json_schema()

	prompt = r"""
	Role & Context
	I want you to act as an expert Data Engineer. I have raw data scraped from a credit card service that is currently unstructured and "dirty." My goal is to categorize this into a dictionary of relevant, clean, analysis-ready data.

	The Data Sample
	Here is a representative sample of the raw data:
	{
		"provider": "capital_one",
		"credit": "GOOD-EXCELLENT",
		"name": "Bass Pro Shops CLUB Card",
		"image": "https://ecm.capitalone.com/WCM/card/products/bass_pro_cardart.png",
		"application_link": "https://applynow.capitalone.com/?brandCode=BASSPRO&marketingChannelCode=UNS&storeId=701",
		"preapproval_link": "https://www.capitalone.com/credit-cards/preapprove?landingPage=ehpnav",
		"details_link": "https://www.capitalone.com/credit-cards/bass-pro-shops",
		"page": "A LOT OF PAGE TEXT"
	}

	An example of the output for the provided data would be:
	{
		"provider": "capital_one",
		"credit": "good-excellent",
		"name": "Bass Pro Shops CLUB Card",
		"image": "https://ecm.capitalone.com/WCM/card/products/bass_pro_cardart.png",
		"application_link": "https://applynow.capitalone.com/?brandCode=BASSPRO&marketingChannelCode=UNS&storeId=701",
		"preapproval_link": "https://www.capitalone.com/credit-cards/preapprove?landingPage=ehpnav",
		"details_link": "https://www.capitalone.com/credit-cards/bass-pro-shops",
		"annual_fee": 0,
		"has_ftf": false,
		"apr": 9.99,
		"cash_back": {
			"bass_pro_shops": 0.05,
			"other": 0.01
		},
		"cash_back_type": "cash",
		"bonus": [{"bonus": 50, "min_spend": 0, "description": "Earn up to $50 in CLUB Points for free gear", "is_welcome": true, "bonus_type": "cash"}],
		"other": ["Beat any price offered local retailers by 5%"],
		"reward_type": "cash"
	}

	Please apply the following logic:
	""" + ("One Card Per Page: [Do not worry about secondary/alternative options presented on the web page: focus only on the primary card offered.]\n" if not multiple else "Multiple Cards: [Extract ALL credit cards found in the data.]\n") + r"""	Remove Attachment: [Do not use the pronouns "I/we/they" for any of the features, for example "we offer feature x...", just mention the feature]
	Unemotional Tone: [For the bonus and other categories, without altering wording or removing precision, the tone of any overly stimulating text should be flattened and made more neutral through editing capitalization, punctuation, and overly emotional adjectives]
	Data Normalization: [e.g., Strip whitespace, remove symbols like $ or % (EXCEPT for 'other' and 'bonus'), and in general ensure that standardized data processing is possible]
	Data Serialization: [Do not group "similar" features in one bullet point, list each point individually; however, do not include redundant or overly specific information]
	Misleading Advertising: [Do not include perks/benefits which are true of all credit cards in general, or generally expected to be true]
	Cherrypicking: [Choose, at a maximum, 4 bonuses and 4 other perks. Do not include more than 4. Pick the ones that are the most unique or useful to use and know]
	Edge Cases: [e.g., If any fees/benefits are applied for the first few years only, use the general case and add the bonus information as a bonus]
	Brevity: [For the other/bonus strings, be as succinct as possible without causing confusion or vagueness. The shorter the text, the better.]
	Cleaning: [If there are any cards with very little data (ex: no page field and no name/urls) to the extent that it cannot be used, remove it.]

	Output Format
	Please provide an array of Attribute objects in a json.dumps format.

	Here is the data:

	""" + data

	response = client.models.generate_content(
	    model="gemini-3.1-pro-preview",
	    contents=prompt,
	    config={
	        "response_mime_type": "application/json",
	        "response_json_schema": schema,
	    },
	)

	if multiple:
		gemini_result = CardList.model_validate_json(response.text)
	else:
		gemini_result = CreditCard.model_validate_json(response.text)
	return gemini_result.model_dump()