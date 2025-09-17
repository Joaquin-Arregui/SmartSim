from simulator.simulationFunctionsScheduler.events import intermediateThrowEvent, messageIntermediateCatchEvent, messageIntermediateThrowEvent, timerIntermediateCatchEvent, endEvent
from simulator.simulationFunctionsScheduler.gateways import exclusiveGateway, parallelGateway, inclusiveGateway
from simulator.simulationFunctionsScheduler.generalTask import generalTask
from simulator.simulationFunctionsScheduler.receiveTask import receiveTask
from simulator.simulationFunctionsScheduler.sendTask import sendTask
from simulator.simulationFunctionsScheduler.schedule import scheduler

GENERAL_TASKS = {
    "BPMNTask",
    "BPMNUserTask",
    "BPMNManualTask",
    "BPMNBusinessRuleTask",
    "BPMNScriptTask",
    "BPMNCallActivity",
    "BPMNServiceTask",
}

SPECIFIC_HANDLERS = {
    "BPMNExclusiveGateway":                 exclusiveGateway,
    "BPMNParallelGateway":                  parallelGateway,
    "BPMNInclusiveGateway":                 inclusiveGateway,
    "BPMNSendTask":                         sendTask,
    "BPMNReceiveTask":                      receiveTask,
    "BPMNScheduler":                        scheduler,
    "BPMNIntermediateThrowEvent":           intermediateThrowEvent,
    "BPMNMessageIntermediateCatchEvent":    messageIntermediateCatchEvent,
    "BPMNMessageIntermediateThrowEvent":    messageIntermediateThrowEvent,
    "BPMNTimerIntermediateCatchEvent":      timerIntermediateCatchEvent,
    "BPMNEndEvent":                         endEvent,
}

def generateFunctionScheduler(elements, element_id, script, schedulingResult, schedulingData):
    element = elements[element_id]
    element_type = type(element).__name__
    if element_type in GENERAL_TASKS:
        handler = generalTask
    else:
        handler = SPECIFIC_HANDLERS.get(element_type)
    return handler(elements, element, script, schedulingResult, schedulingData)