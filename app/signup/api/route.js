import { NextResponse } from "next/server";
import jwt from "jsonwebtoken"; // Import jsonwebtoken
import UserModel from "../../../mongodbConnect";

export async function POST(request) {
  const { name, country, email, dob, phoneNumber, password } =
    await request.json();
  const withdrawalPin = await generateUniquePin();
  const taxCodePin = await generateUniquePin();
  const lowerEmail = email.toLowerCase();

  const user = new UserModel({
    name,
    country,
    email: lowerEmail,
    phone: phoneNumber,
    dob,
    password,
    withdrawalPin,
    taxCodePin,
    autoTrades: true,
    isVerified: false,
    tradingBalance: 0, // Initialize the new number fields
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalAssets: 0,
    trade: 0, // Initialize trade with 0
    balance: 0,
    totalWon: 0,
    totalLoss: 0,
    role: "user", // Set role as "user"
    investmentPackage: "gold plan", // Set investment package as "gold plan"
  });
  try {
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "5d",
    });

    return NextResponse.json({ success: true, email, token }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 400 });
  }
}

async function generateUniquePin() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-#$";
  let pin;

  do {
    pin = "";
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      pin += characters.charAt(randomIndex);
    }
  } while (await isPinExists(pin));

  return pin;
}

async function isPinExists(pin) {
  // Query the database to see if the pin already exists in either the withdrawalPin or taxCodePin fields
  const userWithWithdrawalPin = await UserModel.findOne({ withdrawalPin: pin }); // Use UserModel
  const userWithTaxCodePin = await UserModel.findOne({ taxCodePin: pin }); // Use UserModel

  // Return true if either query finds a user, false otherwise
  return Boolean(userWithWithdrawalPin || userWithTaxCodePin);
}