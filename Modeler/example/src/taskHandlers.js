const axios = require('axios');

function getAllRelevantTasks(bpmnModeler) {
  const elementRegistry = bpmnModeler.get('elementRegistry');
  const canvasRoot = bpmnModeler.get('canvas').getRootElement();
  const definitions = canvasRoot.businessObject.$parent;
  const id_model = definitions.diagrams[0].id;

  // Todos los BOs para cálculos auxiliares
  const allBOs = elementRegistry.filter(() => true).map(e => e.businessObject);

  // Defaults globales definidos como model:KeyValuePair en <definitions>
  const keyValuePairs = (definitions.rootElements || [])
    .filter((el) => el.$type === 'model:KeyValuePair')
    .map((pair) => ({ key: pair.key, value: pair.value }));

  // Mapa auxiliar de defaults por Process (NO se escribe en el BO)
  const defaultsByProcessId = new Map();
  allBOs.forEach((bo) => {
    if (bo.$type === 'bpmn:Process') {
      const current = {};
      keyValuePairs.forEach(({ key, value }) => {
        current[key] = String(value || '')
          .split(',')
          .map(v => v.trim())
          .filter(Boolean);
      });
      defaultsByProcessId.set(bo.id, current);
    }
  });

  // Elementos relevantes, incluyendo custom
  const relevantElements = elementRegistry.filter(e =>
    e.type === 'bpmn:Task' ||
    e.type === 'bpmn:ServiceTask' ||
    e.type === 'bpmn:UserTask' ||
    e.type === 'bpmn:ManualTask' ||
    e.type === 'bpmn:StartEvent' ||
    e.type === 'bpmn:EndEvent' ||
    e.type === 'bpmn:Process' ||
    e.type === 'bpmn:Collaboration' ||
    e.type === 'bpmn:Participant' ||
    e.type === 'bpmn:Lane' ||
    e.type === 'bpmn:SequenceFlow' ||
    e.type === 'bpmn:MessageFlow' ||
    e.type === 'bpmn:IntermediateCatchEvent' ||
    e.type === 'bpmn:DataObjectReference' ||
    e.type === 'bpmn:BoundaryEvent' ||
    e.type === 'bpmn:DataInputAssociation' ||
    e.type === 'bpmn:DataOutputAssociation' ||
    e.type.startsWith('bpmn:') ||
    e.type === 'custom:Scheduler' ||
    e.type.startsWith('custom:')
  );

  const isValidUrl = (v) => {
    if (!v || typeof v !== 'string' || !v.trim()) return false;
    try { new URL(v); return true; } catch { return false; }
  };

  return relevantElements.map(e => {
    const businessObject = e.businessObject;

    // Tipos enriquecidos para eventos
    const hasDefs = businessObject.eventDefinitions && businessObject.eventDefinitions.length > 0;
    const hasDef = (t) => hasDefs && businessObject.eventDefinitions.some(def => def.$type === t);

    let type = e.type;
    if (e.type === 'bpmn:StartEvent' && hasDef('bpmn:MessageEventDefinition')) {
      type = 'bpmn:MessageStartEvent';
    } else if (e.type === 'bpmn:StartEvent' && hasDef('bpmn:TimerEventDefinition')) {
      type = 'bpmn:TimerStartEvent';
    } else if (e.type === 'bpmn:IntermediateCatchEvent' && hasDef('bpmn:MessageEventDefinition')) {
      type = 'bpmn:MessageIntermediateCatchEvent';
    } else if (e.type === 'bpmn:IntermediateCatchEvent' && hasDef('bpmn:TimerEventDefinition')) {
      type = 'bpmn:TimerIntermediateCatchEvent';
    } else if (e.type === 'bpmn:IntermediateThrowEvent' && hasDef('bpmn:MessageEventDefinition')) {
      type = 'bpmn:MessageIntermediateThrowEvent';
    }

    // Relaciones sub/super
    let subTasks = [];
    let subElement = null;
    let superElement = null;

    if (e.type === 'bpmn:DataInputAssociation') {
      superElement = businessObject.sourceRef && businessObject.sourceRef.length > 0
        ? businessObject.sourceRef.map(source => source.id).join(', ')
        : 'No Super Element';

      const targetTask = elementRegistry.find(el =>
        el.businessObject.dataInputAssociations &&
        el.businessObject.dataInputAssociations.some(assoc => assoc.id === businessObject.id)
      );
      subElement = targetTask ? targetTask.businessObject.id : 'No Sub Element';

    } else if (e.type === 'bpmn:DataOutputAssociation') {
      subElement = businessObject.targetRef ? businessObject.targetRef.id : '';
      const parentTask = elementRegistry.find(el =>
        el.businessObject.dataOutputAssociations &&
        el.businessObject.dataOutputAssociations.some(assoc => assoc.id === businessObject.id)
      );
      superElement = parentTask ? [parentTask.businessObject.id].join(', ') : 'No Super Element';

    } else if (e.type === 'bpmn:BoundaryEvent' && businessObject.attachedToRef) {
      const attachedTask = businessObject.attachedToRef;
      subElement = attachedTask.outgoing ? attachedTask.outgoing.map(flow => flow.targetRef.id).join(', ') : '';
      superElement = attachedTask.incoming ? attachedTask.incoming.map(flow => flow.sourceRef.id) : [];

    } else if (e.type === 'bpmn:SequenceFlow' || e.type === 'bpmn:MessageFlow') {
      subElement = businessObject.targetRef ? businessObject.targetRef.id : '';
      superElement = businessObject.sourceRef ? [businessObject.sourceRef.id] : [];

    } else {
      subTasks = businessObject.outgoing ? businessObject.outgoing.map(task => task.targetRef.id) : [];
      subElement = subTasks.join(', ');
      superElement = businessObject.incoming ? businessObject.incoming.map(flow => flow.sourceRef.id) : [];
    }

    // Flags y propiedades varias
    const isServiceTask = e.type === 'bpmn:ServiceTask';
    const isUserTask = e.type === 'bpmn:UserTask';
    const isTask = e.type === 'bpmn:Task' || isUserTask;
    const isProcess = e.type === 'bpmn:Process';
    const isCollaboration = e.type === 'bpmn:Collaboration';
    const isParticipant = e.type === 'bpmn:Participant';
    const isLane = e.type === 'bpmn:Lane';
    const isSequenceFlow = e.type === 'bpmn:SequenceFlow' || e.type === 'bpmn:MessageFlow';

    const percentageOfBranches = isSequenceFlow ? (businessObject.percentageOfBranches || 0) : 0;

    let time = null;
    if (hasDefs) {
      const timerEventDef = businessObject.eventDefinitions.find(def => def.$type === 'bpmn:TimerEventDefinition');
      if (timerEventDef && timerEventDef.timeDuration) {
        time = timerEventDef.timeDuration.body || '';
      }
    }

    const userTasks = Array.isArray(businessObject.UserTask)
      ? businessObject.UserTask
      : [businessObject.UserTask || ''];

    const numberOfExecutions = businessObject.NumberOfExecutions || 1;
    const minimumTime = businessObject.minimumTime || 0;
    const maximumTime = businessObject.maximumTime || 0;
    const loopParameter = businessObject.loopParameter || 'undefined';
    const loopCharacteristics = businessObject.loopCharacteristics || 'undefined';
    const multiInstance = businessObject.loopCharacteristics?.isSequential ?? 'undefined';
    const AdditionalIntegerParameter = businessObject.AdditionalIntegerParameter || 0;

    let instance = '';
    let userWithRoleReturn = {};
    let userWithoutRole = [];
    const userWithoutRoleSet = new Set();
    let frequency = 0;
    let containedElements = businessObject.flowNodeRef
      ? businessObject.flowNodeRef.map(node => node.id)
      : [];

    if (e.type === 'bpmn:Collaboration') {
      if (businessObject && businessObject.instance !== undefined) {
        instance = businessObject.instance;
      }

    } else if (e.type === 'bpmn:Participant') {
      const processRef = businessObject.processRef;

      const participantFrequency = businessObject.frequency || businessObject.get?.('participantWithoutLane:frequency');
      if (participantFrequency !== undefined) {
        frequency = participantFrequency;
      }

      if (processRef) {
        if (processRef.flowElements) {
          containedElements = processRef.flowElements.map(node => node.id);
        }
        if (processRef.laneSets) {
          processRef.laneSets.forEach(laneSet => {
            laneSet.lanes.forEach(lane => {
              if (lane.flowNodeRef) {
                lane.flowNodeRef.forEach(node => containedElements.push(node.id));
              }
            });
          });
        }
      }
      if (businessObject.userWithoutRole) {
        businessObject.userWithoutRole.forEach(role => userWithoutRoleSet.add(role.trim()));
      }
      userWithoutRole = Array.from(userWithoutRoleSet);

    } else if (e.type === 'bpmn:Lane') {
      if (businessObject.userWithoutRole) {
        businessObject.userWithoutRole.forEach(role => userWithoutRoleSet.add(role.trim()));
      }
      containedElements = businessObject.flowNodeRef
        ? businessObject.flowNodeRef.map(node => node.id)
        : [];
      userWithoutRole = Array.from(userWithoutRoleSet);

    } else if (e.type === 'bpmn:Process') {
      if (businessObject.instance !== undefined) instance = businessObject.instance;

      // userWithRole puede estar como array de model:KeyValuePair o como objeto plano
      if (Array.isArray(businessObject.userWithRole)) {
        userWithRoleReturn = Object.fromEntries(
          businessObject.userWithRole.map((kv) => [
            kv.key,
            String(kv.value || '').split(',').map(s => s.trim()).filter(Boolean)
          ])
        );
      } else if (typeof businessObject.userWithRole === 'object' && businessObject.userWithRole !== null) {
        userWithRoleReturn = businessObject.userWithRole;
      }

      if (businessObject.userWithoutRole) {
        userWithoutRole = [...new Set(businessObject.userWithoutRole)];
      }
      if (businessObject.frequency !== undefined) frequency = businessObject.frequency;

      // Merge con defaults del <definitions> (sin tocar el BO)
      const defaults = defaultsByProcessId.get(businessObject.id) || {};
      userWithRoleReturn = { ...defaults, ...userWithRoleReturn };

    } else {
      instance = businessObject.instance || '';
    }

    // custom:Scheduler
    const isCustomScheduler =
      e.type === 'custom:Scheduler' || businessObject.$type === 'custom:Scheduler';

    const rawUrl = isCustomScheduler
      ? (businessObject.url ?? businessObject.get?.('custom:url') ?? '')
      : '';
    const schedulerUrl = isValidUrl(rawUrl) ? rawUrl : '';

    const fileName = isCustomScheduler
      ? (businessObject.fileName ?? businessObject.get?.('custom:fileName') ?? '')
      : '';
    const fileContent = isCustomScheduler
      ? (businessObject.fileContent ?? businessObject.get?.('custom:fileContent') ?? '')
      : '';

    return {
      id_model: id_model,
      id_bpmn: businessObject.id,
      name: businessObject.name || '',
      type: type,

      Mth: isServiceTask ? (businessObject.Mth || 0) : 0,
      P: isServiceTask ? (businessObject.P || 0) : 0,
      User: isServiceTask ? (businessObject.User || '') : '',
      UserTask: (isTask || isUserTask) ? (userTasks.join(', ') || '') : '',

      Log: businessObject.Log || '',
      SubTasks: subTasks,
      subElement: subElement,
      superElement: superElement,

      Instances: isProcess || isCollaboration ? (instance || 0) : 0,
      Frequency: isProcess || isParticipant ? (frequency || 0) : 0,
      PercentageOfBranches: percentageOfBranches,
      NumberOfExecutions: numberOfExecutions,
      MinimumTime: minimumTime,
      MaximumTime: maximumTime,
      UserInstance: instance,
      time: time,

      userWithoutRole: (isProcess || isLane || isParticipant) ? userWithoutRole : '',

      // devolvemos como array de { role, users } (sin tocar BO)
      userWithRole: Object.entries(userWithRoleReturn).map(([role, users]) => ({
        role,
        users: Array.isArray(users) ? users : [users]
      })),

      loopParameter: loopParameter,
      loopCharacteristics: loopCharacteristics,
      multiInstance: multiInstance,
      AdditionalIntegerParameter: AdditionalIntegerParameter,
      containedElements: containedElements,

      // custom:Scheduler
      Url: schedulerUrl,
      FileName: fileName,
      FileContent: fileContent
    };
  });
}

function exportToEsper(bpmnModeler) {
  return new Promise((resolve, reject) => {
    try {
      const elements = getAllRelevantTasks(bpmnModeler);
      const safe = (s) => String(s ?? '').replace(/"/g, '\\"');

      let content = '### Esper Rules Export ###\n\n';

      elements.forEach(element => {
        // El tipo enriquecido ya viene calculado en getAllRelevantTasks (e.g., 'bpmn:MessageStartEvent')
        content += `Element: [type=${element.type}, `;
        content += `name="${safe(element.name) || 'Unnamed'}", `;
        content += `id_bpmn="${safe(element.id_bpmn) || 'Unknown'}", `;

        if (element.time) {
          content += `time=${element.time}, `;
        }

        if (
          element.type === 'bpmn:SequenceFlow' ||
          element.type === 'bpmn:MessageFlow' ||
          element.type === 'bpmn:DataObjectReference' ||
          element.type === 'bpmn:BoundaryEvent' ||
          element.type === 'bpmn:DataInputAssociation' ||
          element.type === 'bpmn:DataOutputAssociation'
        ) {
          if (element.PercentageOfBranches && element.PercentageOfBranches !== 'N/A') {
            content += `percentageOfBranches=${element.PercentageOfBranches}, `;
          }

          const superElement = typeof element.superElement === 'string'
            ? element.superElement
            : (Array.isArray(element.superElement) ? element.superElement.join(', ') : 'No Super Element');

          const subElement = element.subElement || 'No Sub Element';

          content += `superElement="${safe(superElement)}", `;
          content += `subElement="${safe(subElement)}"]\n`;

        } else if (
          element.type === 'bpmn:Task' ||
          element.type === 'bpmn:UserTask' ||
          element.type === 'bpmn:ManualTask' ||
          element.type === 'bpmn:SendTask' ||
          element.type === 'bpmn:ReceiveTask' ||
          element.type === 'bpmn:BusinessRuleTask' ||
          element.type === 'bpmn:ScriptTask' ||
          element.type === 'bpmn:CallActivity' ||
          element.type === 'bpmn:ServiceTask'
        ) {
          content += `userTask="${safe(element.UserTask) || '""'}", `;
          content += `numberOfExecutions=${element.NumberOfExecutions}, `;
          content += `minimumTime=${element.MinimumTime}, `;
          content += `maximumTime=${element.MaximumTime}, `;
          if (element.loopParameter !== 'undefined') {
            content += `loopParameter={"${safe(element.loopParameter)}":${element.AdditionalIntegerParameter}}, `;
          }
          if (element.loopCharacteristics?.isSequential !== undefined) {
            content += `multiInstanceType="${element.loopCharacteristics.isSequential ? 'true' : 'false'}", `;
          }
          const subTasks = element.SubTasks ? element.SubTasks.join(', ') : 'No SubTasks';
          content += `subTask="${safe(subTasks)}"]\n`;

        } else if (element.type === 'custom:Scheduler') {
          content += `url="${safe(element.Url) || ''}", `;
          content += `fileName="${safe(element.FileName) || ''}"]\n`;

        } else if (element.type === 'bpmn:Collaboration') {
          content += `instances=${element.Instances}]\n`;

        } else if (element.type === 'bpmn:Lane') {
          const userWithoutRole = Array.isArray(element.userWithoutRole)
            ? element.userWithoutRole.map(user => `"${safe(user)}"`).join(', ')
            : '""';

          const containedElements = element.containedElements && element.containedElements.length > 0
            ? element.containedElements.map(el => `"${safe(el)}"`).join(', ')
            : '""';

          content += `userWithoutRole=[${userWithoutRole}], containedElements=[${containedElements}]]\n`;

        } else if (element.type === 'bpmn:Process') {
          content += `instances=${element.Instances}, `;
          content += `frequency=${element.Frequency}, `;

          const userWithoutRole = Array.isArray(element.userWithoutRole)
            ? element.userWithoutRole.map(user => `"${safe(user)}"`).join(', ')
            : '""';
          content += `userWithoutRole=[${userWithoutRole}], `;

          // element.userWithRole aquí es un array de { role, users }
          const userWithRole = element.userWithRole
            ? element.userWithRole
                .map(({ role, users }) => {
                  const r = safe(role);
                  const us = (Array.isArray(users) ? users : [users]).map(u => `"${safe(u)}"`).join(', ');
                  return `"${r}": [${us}]`;
                })
                .join(', ')
            : '{}';

          content += `userWithRole={${userWithRole}}]\n`;

        } else if (element.type === 'bpmn:Participant') {
          const userWithoutRole = Array.isArray(element.userWithoutRole)
            ? element.userWithoutRole.map(user => `"${safe(user)}"`).join(', ')
            : '""';

          const containedElements = Array.isArray(element.containedElements)
            ? element.containedElements.map(el => `"${safe(el)}"`).join(', ')
            : '""';

          content += `frequency=${element.Frequency}, userWithoutRole=[${userWithoutRole}], containedElements=[${containedElements}]]\n`;

        } else {
          const subTasks = element.SubTasks ? element.SubTasks.join(', ') : 'No SubTasks';
          content += `subTask="${safe(subTasks)}"]\n`;
        }
      });

      if (elements.length === 0) {
        content += 'No elements generated.\n';
      }

      resolve(content);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  exportToEsper
};
