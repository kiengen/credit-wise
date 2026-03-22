import { NextRequest, NextResponse } from "next/server";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(config);

const categoryMap: Record<string, string> = {
  FOOD_AND_DRINK: "dining",
  FOOD_AND_DRINK_RESTAURANTS: "dining",
  FOOD_AND_DRINK_COFFEE: "dining",
  FOOD_AND_DRINK_FAST_FOOD: "dining",
  FOOD_AND_DRINK_GROCERIES: "grocery",
  TRANSPORTATION: "gas",
  TRANSPORTATION_GAS: "gas",
  TRANSPORTATION_PARKING: "other",
  TRANSPORTATION_PUBLIC_TRANSIT: "other",
  ENTERTAINMENT: "entertainment",
  ENTERTAINMENT_MUSIC: "entertainment",
  ENTERTAINMENT_MOVIES: "entertainment",
  ENTERTAINMENT_GAMES: "entertainment",
  RENT_AND_UTILITIES: "recurring",
  RENT_AND_UTILITIES_INTERNET: "recurring",
  RENT_AND_UTILITIES_TELEPHONE: "recurring",
  RENT_AND_UTILITIES_UTILITIES: "recurring",
  MEDICAL: "pharmacy",
  MEDICAL_PHARMACIES: "pharmacy",
  SHOPPING: "shopping",
  SHOPPING_ELECTRONICS: "shopping",
  SHOPPING_CLOTHING: "shopping",
  TRAVEL: "travel",
  TRAVEL_FLIGHTS: "flights",
  TRAVEL_LODGING: "hotels",
  TRAVEL_RENTAL_CARS: "rental_cars",
};

const airlineKeywords: Record<string, string> = {
  united: "united",
  "air canada": "air-canada",
  lufthansa: "lufthansa",
  "all nippon": "ana",
  ana: "ana",
  singapore: "singapore",
  delta: "delta",
  "air france": "air-france",
  klm: "klm",
  "korean air": "korean-air",
  american: "american",
  "british airways": "british-airways",
  "cathay pacific": "cathay-pacific",
  qantas: "qantas",
};

function mapCategory(personal_finance_category: { primary: string; detailed: string } | undefined): string {
  if (!personal_finance_category) return "other";
  return categoryMap[personal_finance_category.detailed] ?? categoryMap[personal_finance_category.primary] ?? "other";
}

function detectAirlines(description: string): string[] {
  const lower = description.toLowerCase();
  const found: string[] = [];
  for (const [keyword, key] of Object.entries(airlineKeywords)) {
    if (lower.includes(keyword)) found.push(key);
  }
  return found;
}

export async function POST(req: NextRequest) {
  const { public_token } = await req.json();

  const exchangeResponse = await client.itemPublicTokenExchange({ public_token });
  const accessToken = exchangeResponse.data.access_token;

  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - 6);

  const txResponse = await client.transactionsGet({
    access_token: accessToken,
    start_date: startDate.toISOString().slice(0, 10),
    end_date: now.toISOString().slice(0, 10),
    options: { count: 500, offset: 0 },
  });

  let allTransactions = txResponse.data.transactions;
  const total = txResponse.data.total_transactions;

  while (allTransactions.length < total) {
    const more = await client.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: now.toISOString().slice(0, 10),
      options: { count: 500, offset: allTransactions.length },
    });
    allTransactions = allTransactions.concat(more.data.transactions);
  }

  const airlinesSet = new Set<string>();
  const transactions = allTransactions
    .filter((t) => t.amount > 0)
    .map((t) => {
      const desc = t.merchant_name ?? t.name ?? "";
      for (const key of detectAirlines(desc)) airlinesSet.add(key);
      return {
        date: t.date,
        description: desc,
        amount: t.amount,
        category: mapCategory(t.personal_finance_category ?? undefined),
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    transactions,
    airlines: [...airlinesSet],
  });
}
