import  app  from "../../utils/agent.js";

export const sendMessage = async (req, res) => {
    try{
        const {message} = req.body;
        if(!message) return res.status(400).json({error : "message is required"});
        const result = await app.invoke({
            messages : [{ role: "user", content: message.text }
            ]
        },{
            configurable : {
                // take email id here
                thread_id : 'user123'
            }
        });
        let reply = result.messages.at(-1)?.content;
        // console.log("output in index.js:", reply);

        // simple check
            return res.status(200).json({reply});
    } catch (err) {
        // console.error("Agent Error:", err);
        console.log("Agent Error:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }

}
