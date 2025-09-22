import { assign } from 'min-dash';
import { Scheduler } from './dataURL';

export default function PaletteProvider(
  palette,
  create,
  elementFactory,
  spaceTool,
  lassoTool,
  bpmnFactory,
  moddle
) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;
  this._bpmnFactory = bpmnFactory;
  this._moddle = moddle;

  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'bpmnFactory',
  'moddle'
];

PaletteProvider.prototype.getPaletteEntries = function () {

  const actions = {};
  const create = this._create;
  const elementFactory = this._elementFactory;
  const spaceTool = this._spaceTool;
  const lassoTool = this._lassoTool;
  const bpmnFactory = this._bpmnFactory;

  function createAction(type, group, className, title, options, imageUrl) {

function createSchedulerShape() {
  const bo = bpmnFactory.create('bpmn:Task', {
    $attrs: {
      'custom:type': 'scheduler',
      'isScheduler': 'true',
      'custom:url': '',
      'custom:fileName': '',
      'custom:fileContent': ''
    }
  });

  const shape = elementFactory.createShape({
    type: 'bpmn:Task',        // importante para que BpmnUpdater genere el DI correcto
    businessObject: bo,
    width: 100,
    height: 80
  });

  // flag de respaldo en el shape (no en el BO)
  shape.isScheduler = true;

  return shape;
}


function createListener(event) {
  let shape;
  if (type === 'custom:scheduler') {
    shape = createSchedulerShape();
  } else {
    shape = elementFactory.createShape(assign({ type }, options));
    if (options && options.isExpanded !== undefined && shape.businessObject && shape.businessObject.di) {
      shape.businessObject.di.isExpanded = options.isExpanded;
    }
  }
  create.start(event, shape);
}

    const shortType = type.replace(/^bpmn:/, '').replace(/^custom:/, '');

    const action = {
      group,
      className,
      title: title || 'Create ' + shortType,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };

    if (imageUrl) action.imageUrl = imageUrl;
    return action;
  }

  function createParticipant(event, collapsed) {
    create.start(event, elementFactory.createParticipantShape(collapsed));
  }

  assign(actions, {
    'custom-scheduler': createAction(
      'custom:scheduler',
      'custom',
      '',
      'Create Scheduler',
      {},
      Scheduler.dataURL
    ),

    'custom-separator': { group: 'custom', separator: true },

    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: 'Activate the lasso tool',
      action: { click: (event) => lassoTool.activateSelection(event) }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: 'Activate the create/remove space tool',
      action: { click: (event) => spaceTool.activateSelection(event) }
    },
    'tool-separator': { group: 'tools', separator: true },

    'create.start-event': createAction('bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none'),
    'create.intermediate-event': createAction('bpmn:IntermediateThrowEvent', 'event', 'bpmn-icon-intermediate-event-none'),
    'create.end-event': createAction('bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none'),
    'create.exclusive-gateway': createAction('bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-xor'),
    'create.task': createAction('bpmn:Task', 'activity', 'bpmn-icon-task'),
    'create.subprocess-expanded': createAction(
      'bpmn:SubProcess', 'activity', 'bpmn-icon-subprocess-expanded', 'Create expanded SubProcess', { isExpanded: true }
    ),
    'create.participant-expanded': {
      group: 'collaboration',
      className: 'bpmn-icon-participant',
      title: 'Create Pool/Participant',
      action: { dragstart: createParticipant, click: createParticipant }
    }
  });

  return actions;
};
