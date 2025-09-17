def generalTask(elements, element, script, schedulingResult, schedulingData):
    from simulator.simulationFunctionsScheduler.generateFunction import generateFunctionScheduler
    if any(element.id_bpmn in schedulingDataByInstance for schedulingDataByInstance in schedulingData.values()):
        functionStr = f"""
def {element.id_bpmn}(env, name):
    def executeTask(env, TaskName, name, schedulingData, execution):
        userTask = schedulingData[name][TaskName][execution]["bpmn:userTask"]
        duration = schedulingData[name][TaskName][execution]["bpmn:time"]
        timestamp = schedulingData[name][TaskName][execution]["time:timestamp"]
        if "StandBy" in schedulingData[name][TaskName][execution].keys(): 
            timestampStandBy = schedulingData[name][TaskName][execution]["StandBy"]["time:timestamp"]
            endTime = schedulingData[name][TaskName][execution]["StandBy"]["time:endTime"]
            yield env.timeout(int(timestampStandBy)-env.now)
            yield env.timeout(int(endTime)-int(timestampStandBy))
            simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="StandBy"/>
            <string key="bpmn:id" value="{{TaskName}}"/>
            <string key="bpmn:execution" value="{{execution}}"/>
            <date key="time:timestamp" value="{{timestampStandBy}}"/>
            <date key="time:endTime" value="{{endTime}}"/>
            <date key="time:duration" value="{{int(endTime)-int(timestampStandBy)}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
        yield env.timeout(int(timestamp)-env.now)
        simulationResults[name].append(f'''
        <event>
            <string key="bpmn:type" value="{element.bpmn_type}"/>
            <string key="bpmn:name" value="{element.name}"/>
            <string key="bpmn:id" value="{{TaskName}}"/>
            <string key="bpmn:userTask" value="{{userTask}}"/>
            <int key="bpmn:execution" value="{{execution}}"/>
            <int key="bpmn:time" value="{{duration}}"/>
            <string key="bpmn:subTask" value="{element.subTask}"/>
            <date key="time:timestamp" value="{{timestamp}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
        yield env.timeout(int(duration))
    
    TaskName = '{element.id_bpmn}'
    schedulingData = {schedulingData}
    executions = schedulingData[name][TaskName].keys()
    if "StandByData" in schedulingData[name][TaskName].keys():
        timestampStandBy = schedulingData[name][TaskName]["StandByData"]["time:timestamp"]
        endTime = schedulingData[name][TaskName]["StandBy"]["time:endTime"]
        schedulingData[name][TaskName].pop("StandByData")
        yield env.timeout(int(endTime)-int(timestampStandBy))
        simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="StandByData"/>
            <string key="bpmn:id" value="{{TaskName}}"/>
            <date key="time:timestamp" value="{{timestampStandBy}}"/>
            <date key="time:endTime" value="{{endTime}}"/>
            <date key="time:duration" value="{{int(endTime)-int(timestampStandBy)}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
    executionProcesses = []
    for execution in sorted(executions, key=int):
        executionProcesses.append(env.process(executeTask(env, TaskName, name, schedulingData, execution)))
    yield simpy.AllOf(env, executionProcesses)
    if TaskName in generatedData.keys():
        dataObjects = generatedData[TaskName]
        for dataObject in dataObjects:
            data.append((dataObject, name))
            simulationResults[name].append(
f'''
        <container key="dataObjects">
            <string key="bpmn:id" value="{{dataObject}}"/>
            <string key="bpmn:name" value="{{dataInfo[dataObject]}}"/>
            <date key="time:generationTime" value="{{env.now}}"/>
        </container>''')
    for key, values in gatewayConnections.items():
        if TaskName in values:
            if (key, name) in gatewayOccurrences.keys():
                gatewayOccurrences[(key, name)] =+ 1
            else:
                gatewayOccurrences[(key, name)] = 1
    return '{element.subTask}'
"""
    else:
        functionStr = f"""
def {element.id_bpmn}(env, name):
    def executeTask(env, TaskName, name, execution):
        start_standBy = env.now
        possibleUsers = {element.userTask}
        if possibleUsers is None:
            possibleUsers = userPool
        possibleUsers = resolve_possible_users(possibleUsers, TaskName)
        available_users = [user for user in possibleUsers if user_resources[user].count < user_resources[user].capacity]
        while not available_users:
            yield env.timeout(1)
            available_users = [user for user in possibleUsers if user_resources[user].count < user_resources[user].capacity]
        if available_users:
            userTask = min(available_users, key=lambda u: user_assignments[u])
            user_assignments[userTask] += 1
            request = user_resources[userTask].request()
            yield request
            try:
                time = resolve_task_time('{element.id_bpmn}', {element.maximumTime}, {element.minimumTime}, userTask)
                if env.now > start_standBy: 
                    simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="StandBy"/>
            <string key="bpmn:id" value="{{TaskName}}"/>
            <string key="bpmn:execution" value="{{execution}}"/>
            <date key="time:timestamp" value="{{start_standBy}}"/>
            <date key="time:endTime" value="{{env.now}}"/>
            <date key="time:duration" value="{{env.now-start_standBy}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
                simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="{element.bpmn_type}"/>
            <string key="bpmn:name" value="{element.name}"/>
            <string key="bpmn:id" value="{{TaskName}}"/>
            <string key="bpmn:userTask" value="{{userTask}}"/>
            <int key="bpmn:execution" value="{{execution}}"/>
            <int key="bpmn:time" value="{{time}}"/>
            <string key="bpmn:subTask" value="{element.subTask}"/>
            <date key="time:timestamp" value="{{env.now}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
                yield env.timeout(time)
            finally:
                user_resources[userTask].release(request)
    TaskName = '{element.id_bpmn}'
    if TaskName in requiredData.keys():
        dataObjects = requiredData[TaskName]
        start_standBy_data = env.now
        while not all((dataObject, name) in data for dataObject in dataObjects):
            yield env.timeout(1)
        if env.now > start_standBy_data:
            simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="StandByData"/>
            <string key="bpmn:id" value="{{TaskName}}"/>
            <date key="time:timestamp" value="{{start_standBy_data}}"/>
            <date key="time:endTime" value="{{env.now}}"/>
            <date key="time:duration" value="{{env.now-start_standBy_data}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')"""
        if element.multiInstanceType == True or (element.multiInstanceType == None and element.loopParameter == None):
            functionStr = functionStr + f"""
    for execution in range({element.numberOfExecutions}):
        yield env.process(executeTask(env, TaskName, name, execution+1))"""
        elif element.multiInstanceType == False:
            functionStr = functionStr + f"""
    executionProcesses = []
    for execution in range({element.numberOfExecutions}):
        executionProcesses.append(env.process(executeTask(env, TaskName, name, execution+1)))
    yield simpy.AllOf(env, executionProcesses)"""
        elif element.multiInstanceType == None:
            if "Time" in element.loopParameter.keys():
                time = element.loopParameter["Time"]
            else:
                time = 0
            if "Units" in element.loopParameter.keys():
                units = element.loopParameter["Units"]
            else:
                units = -1
            if "Percentage" in element.loopParameter.keys():
                percentage = 1 - element.loopParameter["Percentage"]/100
            else:
                percentage = 1
            functionStr = functionStr + f"""
    units = {units}
    loopStartTime = env.now
    initial = True
    execution = 0
    while ((env.now - loopStartTime < {time}) or ({time}==0)) and (units!=0) and (random.random() < {percentage}) or initial:
        execution = execution + 1
        initial = False
        yield env.process(executeTask(env, TaskName, name, execution))
        units = units - 1"""
        functionStr = functionStr + f"""
    if TaskName in generatedData.keys():
        dataObjects = generatedData[TaskName]
        for dataObject in dataObjects:
            data.append((dataObject, name))
            simulationResults[name].append(
f'''
        <container key="dataObjects">
            <string key="bpmn:id" value="{{dataObject}}"/>
            <string key="bpmn:name" value="{{dataInfo[dataObject]}}"/>
            <date key="time:generationTime" value="{{env.now}}"/>
        </container>''')
    for key, values in gatewayConnections.items():
        if TaskName in values:
            if (key, name) in gatewayOccurrences.keys():
                gatewayOccurrences[(key, name)] =+ 1
            else:
                gatewayOccurrences[(key, name)] = 1
    return '{element.subTask}'
"""
    return generateFunctionScheduler(elements, element.subTask, script + functionStr, schedulingResult, schedulingData)