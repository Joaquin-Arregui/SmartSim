import os
import csv
import json
import requests
import subprocess
from io import StringIO
from simulator.parser import parse_bpmn_elements
from simulator.generateScript import generateScript
from simulator.generateScriptScheduling import generateScriptScheduling, generateScriptScheduled

def sendToCSV(csv_value, url, timeReady):
    vessels = []
    f = StringIO(csv_value)
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

def processSimulation(rules, csv):
    elements, process, starts, messageStarts = parse_bpmn_elements(rules)
    for key in elements:
        if elements[key].__class__.__name__ == "BPMNScheduler":
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
            ready = int(value['timeReady'])
            timeReady[int(key.split()[-1])] = ready
        api_url  = scheduler.api
        try:
            result = sendToCSV(csv, api_url, timeReady)
            print(result)
        except Exception as e:
            print("Error enviando a la API:", e)
        script, process = generateScriptScheduled(elements, process, starts, messageStarts, result, schedulingData)
        with open(script_name, 'w') as f:
            f.write(script)

        subprocess.run(['python', script_name])
        os.remove(script_name)

    else:
        script, process = generateScript(elements, process, starts, messageStarts)
        script_name = f'script_{process}.py'
        with open(script_name, 'w') as f:
            f.write(script)

        subprocess.run(['python', script_name])
        os.remove(script_name)