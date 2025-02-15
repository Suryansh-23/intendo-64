import createClient from "openapi-fetch";
// @ts-ignore
import { components, paths } from "../schema";
import { initialize } from "./analyzer";
import { createEncoder } from "./encoder";

type AdvanceRequestData = components["schemas"]["Advance"];
type InspectRequestData = components["schemas"]["Inspect"];
type RequestHandlerResult = components["schemas"]["Finish"]["status"];
type RollupsRequest = components["schemas"]["RollupRequest"];
type InspectRequestHandler = (data: InspectRequestData) => Promise<void>;
type AdvanceRequestHandler = (
    data: AdvanceRequestData
) => Promise<RequestHandlerResult>;

const rollupServer = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollupServer);

// Initialize NLP processor instance
const analyzer = await initialize();
const encoder = createEncoder();

const handleAdvance: AdvanceRequestHandler = async (data) => {
    console.log("Received advance request data " + JSON.stringify(data));

    try {
        // Convert hex payload to text
        const userInput = Buffer.from(data.payload.slice(2), "hex").toString(
            "utf8"
        );
        console.log("Decoded user input:", userInput);

        // Analyze with NLP
        const analysis = await analyzer.analyzeMessage(userInput);
        console.log("NLP Analysis Result:", JSON.stringify(analysis, null, 2));

        // Encode for smart contract
        const encodedAction = encoder.encodeAction(analysis);
        console.log("Encoded Action:", encodedAction);

        return "accept";
    } catch (error) {
        console.error("Error processing request:", error);
        return "reject";
    }
};

const handleInspect: InspectRequestHandler = async (data) => {
    console.log("Received inspect request data " + JSON.stringify(data));
};

const main = async () => {
    const { POST } = createClient<paths>({ baseUrl: rollupServer });
    let status: RequestHandlerResult = "accept";
    while (true) {
        const { response } = await POST("/finish", {
            body: { status },
            parseAs: "text",
        });

        if (response.status === 200) {
            const data = (await response.json()) as RollupsRequest;
            switch (data.request_type) {
                case "advance_state":
                    status = await handleAdvance(
                        data.data as AdvanceRequestData
                    );
                    break;
                case "inspect_state":
                    await handleInspect(data.data as InspectRequestData);
                    break;
            }
        } else if (response.status === 202) {
            console.log(await response.text());
        }
    }
};

main().catch((e) => {
    console.log(e);
    process.exit(1);
});

