import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const responseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    transactions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          date: { type: SchemaType.STRING, description: "Transaction date, e.g. 2025-01-15" },
          description: { type: SchemaType.STRING, description: "Merchant or transaction description" },
          amount: { type: SchemaType.NUMBER, description: "Dollar amount as a positive number" },
          category: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["dining", "groceries", "recurring", "gas", "entertainment", "foreign", "travel", "pharmacy", "shopping", "other"],
            description: "Spending category",
          },
        },
        required: ["date", "description", "amount", "category"],
      },
    },
    airlines_detected: {
      type: SchemaType.ARRAY,
      description: "Airlines the user has flown with or purchased from, identified from transactions",
      items: {
        type: SchemaType.STRING,
        format: "enum",
        enum: [
          "united", "air-canada", "lufthansa", "ana", "singapore",
          "delta", "air-france", "klm", "korean-air",
          "american", "british-airways", "cathay-pacific", "qantas",
        ],
      },
    },
  },
  required: ["transactions", "airlines_detected"],
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const text = await file.text();

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-pro-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const prompt = `Extract every PURCHASE transaction from this bank statement and categorize each one. Only include money spent (debits/charges). Exclude payments, credits, refunds, deposits, and transfers.

Categories:
- dining: Restaurants, bars, delivery, cafes, fast food
- groceries: Supermarkets, grocery stores, farmers markets
- recurring: Subscriptions, phone, internet, utilities
- gas: Fuel
- entertainment: Movies, concerts, events, sports
- foreign: Non-domestic currency purchases
- travel: Flights, hotels, car rentals
- pharmacy: Drugstores, prescriptions
- shopping: Online shopping, retail, electronics, clothing
- other: Everything else

Also identify any airlines the user has purchased from. Map them to these keys:
united, air-canada, lufthansa, ana, singapore, delta, air-france, klm, korean-air, american, british-airways, cathay-pacific, qantas

Bank statement:
${text}`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());

  return NextResponse.json({
    transactions: parsed.transactions,
    airlines: parsed.airlines_detected,
  });
}
