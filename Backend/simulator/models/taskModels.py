from simulator.models.baseModels import BPMNElement
from typing import List, Dict

class BPMNTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNUserTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNSendTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, messageDestiny: str, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.messageDestiny = messageDestiny
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNReceiveTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, messageOrigin: str, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.messageOrigin = messageOrigin
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNManualTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNBusinessRuleTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNScriptTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNCallActivity(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask

class BPMNServiceTask(BPMNElement):
    def __init__(self, name: str, id_bpmn: str, bpmn_type: str, userTask: List[str], numberOfExecutions: int, minimumTime: int, maximumTime: int, minimumTimeByUser: Dict[str, int], maximumTimeByUser: Dict[str, int], loopParameter: Dict[str, int], multiInstanceType: bool, subTask: BPMNElement):
        super().__init__(name, id_bpmn, bpmn_type)
        self.userTask = userTask
        self.numberOfExecutions = numberOfExecutions
        self.minimumTime = minimumTime
        self.maximumTime = maximumTime
        self.minimumTimeByUser = minimumTimeByUser
        self.maximumTimeByUser = maximumTimeByUser
        self.loopParameter = loopParameter
        self.multiInstanceType = multiInstanceType
        self.subTask = subTask