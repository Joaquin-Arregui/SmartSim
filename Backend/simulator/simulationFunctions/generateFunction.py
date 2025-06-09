from simulator.simulationFunctions.events import intermediateThrowEvent, messageIntermediateCatchEvent, messageIntermediateThrowEvent, timerIntermediateCatchEvent, endEvent
from simulator.simulationFunctions.gateways import exclusiveGateway, parallelGateway, inclusiveGateway
from simulator.simulationFunctions.generalTask import generalTask
from simulator.simulationFunctions.receiveTask import receiveTask
from simulator.simulationFunctions.sendTask import sendTask

HANDLERS = {
    "BPMNExclusiveGateway":                 exclusiveGateway,
    "BPMNParallelGateway":                  parallelGateway,
    "BPMNInclusiveGateway":                 inclusiveGateway,
    "BPMNGeneralTask":                      generalTask,
    "BPMNSendTask":                         sendTask,
    "BPMNReceiveTask":                      receiveTask,
    "BPMNIntermediateThrowEvent":           intermediateThrowEvent,
    "BPMNMessageIntermediateCatchEvent":    messageIntermediateCatchEvent,
    "BPMNMessageIntermediateThrowEvent":    messageIntermediateThrowEvent,
    "BPMNTimerIntermediateCatchEvent":      timerIntermediateCatchEvent,
    "BPMNEndEvent":                         endEvent,
}

def generateFunction(elements, element_id, script: bool = False):
    element = elements[element_id]
    element_type = type(element).__name__
    handler = HANDLERS.get(element_type)
    return handler(elements, element, script)