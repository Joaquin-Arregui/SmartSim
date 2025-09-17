
def scheduler(elements, element, script, schedulingResult, schedulingData):
    from simulator.simulationFunctionsScheduler.generateFunction import generateFunctionScheduler
    
    functionStr = f"""
def {element.id_bpmn}(env, name):
    schedulingResult = {schedulingResult}
    TaskName = '{element.id_bpmn}'
    untilTime = schedulingResult['timers'][name.split()[-1]]
    simulationResults[name].append(f'''
        <event>
            <string key="bpmn:type" value="{element.bpmn_type}"/>
            <string key="bpmn:name" value="{element.name}"/>
            <string key="bpmn:id" value="{{TaskName}}"/>
            <string key="scheduler:time" value="{{untilTime}}"/>
            <string key="bpmn:subTask" value="{element.subTask}"/>
            <date key="time:timestamp" value="{{env.now}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
    yield env.timeout(untilTime-env.now)
    return '{element.subTask}'
    """
    extendedScript = generateFunctionScheduler(elements, element.subTask, script + functionStr, schedulingResult, schedulingData)
    return extendedScript