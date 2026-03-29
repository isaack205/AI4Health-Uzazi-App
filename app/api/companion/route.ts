import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { message, conversationHistory, userId, language, dayPostpartum } = await req.json();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendData = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Simulated AI Logic
        const input = message.toLowerCase();
        let responseText = "";
        let isCrisis = false;
        let triggerBreathing = false;

        // Distress detection
        if (/(suicide|kill myself|end my life|hurt my baby|harm myself|don't want to live)/.test(input)) {
          isCrisis = true;
          responseText = language === "en" 
            ? "I'm so sorry you're feeling this way. Please know you're not alone. Reach out to Befrienders Kenya at 0722 178 177 right now." 
            : language === "sw"
            ? "Pole sana kwa unavyohisi. Tafadhali jua hauko peke yako. Wasiliana na Befrienders Kenya kwa 0722 178 177 sasa hivi."
            : "Nĩ ndĩa kĩeha mũno nĩ ũndũ ũrĩa ũraigua. Menya atĩ ndũrĩ wiki. Aria na Befrienders Kenya thimũ-inĩ 0722 178 177 rĩu.";
        } else if (/(anxious|anxiety|scared|panic|overwhelmed|heart racing)/.test(input)) {
          triggerBreathing = true;
          responseText = language === "en"
            ? "It sounds like things are feeling very heavy right now. Let's take a small moment to breathe together."
            : language === "sw"
            ? "Inaonekana mambo ni magumu sana sasa hivi. Hebu tuchukue muda mfupi kuvuta pumzi pamoja."
            : "Nĩ kũoneka maũndũ nĩ maritũ mũno rĩu. Ta tũhũhie rĩera hamwe o kahora.";
        } else if (/(sleep|can't sleep|insomnia|tired)/.test(input)) {
          responseText = language === "en"
            ? "The nights can feel so long when sleep won't come. It's okay to just rest your eyes and be still."
            : language === "sw"
            ? "Usiku unaweza kuonekana mrefu sana wakati usingizi hauji. Ni sawa kupumzisha macho yako tu."
            : "Ũtukũ nĩũkũoneka mũraihu mũno rĩrĩa ũrogĩ ũregĩte gũka. Nĩ wega o kũhunjia maitho maku na gũikara o ũguo.";
        } else {
          responseText = language === "en"
            ? "I hear you, and I'm right here. Your feelings are valid, and this season will eventually find its rhythm."
            : language === "sw"
            ? "Nanakusikia, na niko hapa kabisa. Hisia zako ni za kweli, na msimu huu utapata mdundo wake baadaye."
            : "Nĩndagũthikĩrĩria, na ndĩ haha hamwe nawe. Ũrĩa ũraigua nĩ wa ma, na ihinda rĩrĩ nĩ rĩgaacoka rĩgĩe na mũnyaka wario.";
        }

        // Stream the response word by word
        const words = responseText.split(" ");
        for (const word of words) {
          sendData({ content: word + " ", isCrisis, triggerBreathing });
          await new Promise((resolve) => setTimeout(resolve, 80)); // Simulate typing
        }

        sendData("[DONE]");
        controller.close();

        // If crisis, trigger background alert
        if (isCrisis && userId) {
          fetch(`${new URL(req.url).origin}/api/companion/alert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, alertType: "crisis", messageContent: message })
          }).catch(console.error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
