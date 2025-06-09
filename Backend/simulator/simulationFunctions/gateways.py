def getPercentOfBranches(elements, gateway):
    possibleElements = {}
    for element in elements.values():
        if type(element).__name__ == "BPMNSequenceFlow" and element.superElement == gateway:
            if element.percentageOfBranches is None:
                percentages = {0: None}
            else:
                percentages = {0: element.percentageOfBranches}
            percentages.update(element.percentageIntervention)
            possibleElements[element.subElement] = percentages
    '''
    total_assigned_percent = sum([v for v in possibleElements.values() if v is not None])
    remaining_percent = 1 - total_assigned_percent
    if none_elements:
        equal_percent = remaining_percent / len(none_elements)
        for sub_element in none_elements:
            possibleElements[sub_element] = equal_percent'''
    return list(possibleElements.keys()), list(possibleElements.values())

def exclusiveGateway(elements, element, script):
    from simulator.simulationFunctions.generateFunction import generateFunction
    possibleElements, percents = getPercentOfBranches(elements, element.id_bpmn)
    functionStr = f"""
def {element.id_bpmn}(env, name):
    percents = []
    for branch in {percents}:
        percent = None
        for interventionTime, newPercentage in branch.items():
            if env.now >= interventionTime:
                percent = newPercentage / 100
        percents.append(percent)
    totalPercentage = sum(x for x in percents if x is not None)
    nones = percents.count(None)
    percents = [((1-totalPercentage)/nones) if x is None else x for x in percents]
    selectedElement = random.choices({possibleElements}, percents)[0]
    simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="{element.bpmn_type}"/>
            <string key="bpmn:name" value="{element.name}"/>
            <string key="bpmn:id" value="{element.id_bpmn}"/>
            <string key="bpmn:subTask" value="{{selectedElement}}"/>
            <date key="time:timestamp" value="{{env.now}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
    yield env.timeout(0)
    return selectedElement
    """
    extendedScript = script + functionStr
    for elem in possibleElements:
        if ('def ' + elem + '(env, name)') not in script:
            extendedScript = generateFunction(elements, elem, extendedScript)
    return extendedScript

def parallelGateway(elements, element, script):
    from simulator.simulationFunctions.generateFunction import generateFunction
    possibleElements = element.subTask
    functionStr = f"""
def {element.id_bpmn}(env, name):
    strSelectedElements = ", ".join({possibleElements})
    simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="{element.bpmn_type}"/>
            <string key="bpmn:name" value="{element.name}"/>
            <string key="bpmn:id" value="{element.id_bpmn}"/>
            <string key="bpmn:subTask" value="{{strSelectedElements}}"/>
            <date key="time:timestamp" value="{{env.now}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
    yield env.timeout(0)
    return {possibleElements}
    """
    extendedScript = script + functionStr
    for elem in possibleElements:
        if ('def ' + elem + '(env, name)') not in script:
            extendedScript = generateFunction(elements, elem, extendedScript)
    return extendedScript

def inclusiveGateway(elements, element, script):
    from simulator.simulationFunctions.generateFunction import generateFunction
    possibleElements, percents = getPercentOfBranches(elements, element.id_bpmn)
    functionStr = f"""
def {element.id_bpmn}(env, name):
    elements = {possibleElements}
    percents = []
    for branch in {percents}:
        percent = None
        for interventionTime, newPercentage in branch.items():
            if env.now >= interventionTime:
                percent = newPercentage / 100
        percents.append(percent)
    percents = [0.5 if x is None else x for x in percents]
    selectedElements = []
    while not selectedElements:
        selectedElements = [element for element, percent in zip(elements, percents) if random.random() < percent]
    strSelectedElements = ", ".join(selectedElements)
    simulationResults[name].append(
f'''
        <event>
            <string key="bpmn:type" value="{element.bpmn_type}"/>
            <string key="bpmn:name" value="{element.name}"/>
            <string key="bpmn:id" value="{element.id_bpmn}"/>
            <string key="bpmn:subTask" value="{{selectedElements}}"/>
            <date key="time:timestamp" value="{{env.now}}"/>
            <int key="bpmn:instance" value="{{name.split()[-1]}}"/>
        </event>''')
    yield env.timeout(0)
    return selectedElements
    """
    extendedScript = script + functionStr
    for elem in possibleElements:
        if ('def ' + elem + '(env, name)') not in script:
            extendedScript = generateFunction(elements, elem, extendedScript)
    return extendedScript