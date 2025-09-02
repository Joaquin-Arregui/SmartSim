import os
import json
import subprocess
from simulator.parser import parse_bpmn_elements
from simulator.generateScript import generateScript
from simulator.generateScriptScheduling import generateScriptScheduling, generateScriptScheduled

import csv
import requests

def sendToCSV(csv_path, url, timeReady):
    vessels = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=';')
        required = {"nInstance", "direction", "time_ready", "DL", "beam", "vmax", "draft"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise KeyError(f"Faltan columnas en CSV: {sorted(missing)}")
        for _, row in enumerate(reader, start=1):
            nInstance = int(row["nInstance"])
            direction = row["direction"] == "1"
            time_ready = timeReady[nInstance]
            DL = int(row["DL"])
            beam = int(row["beam"])
            vmax = int(row["vmax"])
            draft = float(row["draft"])
            v = {
                "nInstance":  nInstance,
                "direction": direction,
                "time_ready": time_ready,
                "DL":         DL,
                "beam":       beam,
                "vmax":       vmax,
                "draft":      draft,
            }
            vessels.append(v)
    payload = {"vessels": vessels}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    return resp.json()

def processSimulation(rules):
    elements, process, starts, messageStarts = parse_bpmn_elements(rules)
    for key in elements:
        if key.startswith("Scheduler"):
            scheduler = elements[key]
            scheduled = True
    if scheduled:
        script, process = generateScriptScheduling(elements, process, starts, messageStarts)
        script_name = f'script_{process}.py'
        with open(script_name, 'w') as f:
            f.write(script)

        subprocess.run(['python', script_name])
        os.remove(script_name)
        with open("schedulingData.json", 'r') as f:
            schedulingData = json.load(f)
        os.remove("schedulingData.json")
        timeReady = {}
        for key, value in schedulingData.items():
            eventPreScheduler = value[value["preScheduler"]]
            ready = int(eventPreScheduler['bpmn:time']) + int(eventPreScheduler['time:timestamp'])
            timeReady[int(key.split()[-1])] = ready
        csv_path = scheduler.properties
        api_url  = scheduler.api
        try:
            result = sendToCSV(csv_path, api_url, timeReady)
        except Exception as e:
            print("Error enviando a la API:", e)
        script, process = generateScriptScheduled(elements, process, starts, messageStarts, result, schedulingData)

    else:
        script, process = generateScript(elements, process, starts, messageStarts)
        script_name = f'script_{process}.py'
        with open(script_name, 'w') as f:
            f.write(script)

        subprocess.run(['python', script_name])
        os.remove(script_name)