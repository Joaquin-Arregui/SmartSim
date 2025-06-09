from simulator.models.baseModels import BPMNElement
from typing import List, Dict

class BPMNGeneralTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement, minimumTimeIntervention: Dict[int, int], maximumTimeIntervention: Dict[int, int]):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask
        self.minimumTimeIntervention = minimumTimeIntervention
        self.maximumTimeIntervention = maximumTimeIntervention

class BPMNSendTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, messageDestiny: str, loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement, minimumTimeIntervention: Dict[int, int], maximumTimeIntervention: Dict[int, int]):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.messageDestiny = messageDestiny
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask
        self.minimumTimeIntervention = minimumTimeIntervention
        self.maximumTimeIntervention = maximumTimeIntervention

class BPMNReceiveTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, messageOrigin: str, loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement, minimumTimeIntervention: Dict[int, int], maximumTimeIntervention: Dict[int, int]):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.messageOrigin = messageOrigin
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask
        self.minimumTimeIntervention = minimumTimeIntervention
        self.maximumTimeIntervention = maximumTimeIntervention