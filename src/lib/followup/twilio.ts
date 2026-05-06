import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
const authToken = process.env.TWILIO_AUTH_TOKEN || "";
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886";

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendWhatsAppFollowUp(to: string, message: string) {
  try {
    if (!client || !process.env.TWILIO_ACCOUNT_SID) {
      console.log(`[Mock Twilio] Sending WhatsApp to ${to}: ${message}`);
      return { success: true, mock: true };
    }

    // Clean phone number (remove all non-digit characters and prepend +)
    const cleanTo = `+${to.replace(/\D/g, "")}`;

    const response = await client.messages.create({
      body: message,
      from: whatsappNumber,
      to: `whatsapp:${cleanTo}`
    });

    return { success: true, messageId: response.sid, mock: false };
  } catch (error) {
    console.error("Twilio WhatsApp Error:", error);
    return { success: false, error };
  }
}
