def scheduler(elements, element, script):
    from simulator.simulationFunctions.generateFunction import generateFunction
    functionStr = f"""
def {element.id_bpmn}(env, name):
    simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="{element.bpmn_type}"/>
            <string key="bpmn:name" value="{element.name}"/>
            <string key="bpmn:id" value="{element.id_bpmn}"/>
            <date key="time:timestamp" value="{{env.now}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
    yield env.timeout(0)
    """
    extendedScript = generateFunction(elements, element.subTask, script + functionStr)
    return extendedScript