
SCHEDULING_DONE = 0

def scheduler(elements, element, script):
    from simulator.simulationFunctions.generateFunction import generateFunction
    global SCHEDULING_DONE
    if SCHEDULING_DONE == 0:
        functionStr = f"""
def {element.id_bpmn}(env, name):
    yield env.timeout(0)
    """
    else:
        SCHEDULING_DONE = 1
    extendedScript = generateFunction(elements, element.subTask, script + functionStr)
    return extendedScript