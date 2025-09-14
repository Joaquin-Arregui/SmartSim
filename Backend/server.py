from heatMap.main import getHeatMap
from simulator.main import processSimulation
from chatbot.main import callAPI
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

MESSAGES = []

@app.route('/simulate', methods=['POST'])
def startSimulation():

    data = request.get_json(force=True)

    rules = data.get("content", "").strip()
    diagram = data.get("diagramXML", "").strip()
    filename = data.get("filename", "esperTasks.txt")
    diagramfilename = data.get("diagramfilename", "diagram.bpmn")

    scriptDir = os.path.dirname(__file__)
    outDir = os.path.join(os.path.dirname(scriptDir), 'Backend', 'simulator', 'files')
    os.makedirs(outDir, exist_ok=True)  # <--

   
    csv_content = data.get("csv")                                                  
    csv_filename = data.get("csvfilename")                                         
    if csv_content and csv_filename:                                               
        with open(os.path.join(outDir, csv_filename), "w", encoding="utf-8") as f: 
            f.write(csv_content)                                                   

    resultsPath = os.path.join(os.path.dirname(scriptDir), 'Backend', 'heatMap', 'files', 'resultSimulation.xes')

    processSimulation(rules)

    with open(resultsPath, "r", encoding="utf-8") as f:
        simulation = f.read()

    systemPrompt = """You are an assistant expert in BPMN modeling and simulation. ..."""

    contextInfo = f"Simulation Log:\n{simulation}\n\nDiagram BPMN:\n{diagram}\n"

    global MESSAGES
    MESSAGES = [
        {"role": "system", "content": systemPrompt},
        {"role": "system", "content": "Context:\n" + contextInfo},
    ]

    heatMap = getHeatMap(diagram)

    os.remove(resultsPath)
    return jsonify({
        "simulation": simulation,
        "heatMap": heatMap,
        "reply": "Type your message below."
    })

@app.route('/continueChat', methods=['POST'])
def continueChat():
    global MESSAGES

    data = request.get_json(force=True)

    user_message = data.get("message", "").strip()
    llm = data.get("llm", "").strip()

    if not user_message:
        return jsonify({"reply": "No message received."}), 400

    MESSAGES.append({"role": "user", "content": user_message})

    answer = callAPI(MESSAGES, llm)

    MESSAGES.append({"role": "assistant", "content": answer})
    return jsonify({"reply": answer})

if __name__ == '__main__':
    app.run(port=3000, debug=False)
