import { assign } from 'min-dash';
import { Scheduler } from './dataURL';

/**
 * A palette that allows you to create BPMN _and_ custom elements.
 */
export default function PaletteProvider(palette, create, elementFactory, spaceTool, lassoTool) {
  this._create = create;
  this._elementFactory = elementFactory;
  this._spaceTool = spaceTool;
  this._lassoTool = lassoTool;

  palette.registerProvider(this);
}

PaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool'
];

PaletteProvider.prototype.getPaletteEntries = function (element) {

  var actions = {},
    create = this._create,
    elementFactory = this._elementFactory,
    spaceTool = this._spaceTool,
    lassoTool = this._lassoTool;

  function createAction(type, group, className, title, options, imageUrl) {

    function createListener(event) {
      var shape = elementFactory.createShape(assign({ type: type }, options));

      if (options && options.isExpanded !== undefined) {
        shape.businessObject.di.isExpanded = options.isExpanded;
      }

      create.start(event, shape);
    }

    var shortType = type.replace(/^bpmn:/, '').replace(/^custom:/, '');

    const action = {
      group: group,
      className: className,
      title: title || 'Create ' + shortType,
      action: {
        dragstart: createListener,
        click: createListener
      }
    };

    if (imageUrl) {
      action.imageUrl = imageUrl;
    }

    return action;
  }

  function createParticipant(event, collapsed) {
    create.start(event, elementFactory.createParticipantShape(collapsed));
  }

  assign(actions, {
    // --- ELEMENTO PERSONALIZADO: Scheduler ---
    'custom-scheduler': createAction(
      'custom:scheduler',
      'custom',
      '', // No se necesita className si se usa imageUrl
      'Create Scheduler',
      {},
      Scheduler.dataURL
    ),

    // --- Separador de grupo custom ---
    'custom-separator': {
      group: 'custom',
      separator: true
    },

    // --- Herramientas básicas ---
    'lasso-tool': {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: 'Activate the lasso tool',
      action: {
        click: function (event) {
          lassoTool.activateSelection(event);
        }
      }
    },
    'space-tool': {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: 'Activate the create/remove space tool',
      action: {
        click: function (event) {
          spaceTool.activateSelection(event);
        }
      }
    },
    'tool-separator': {
      group: 'tools',
      separator: true
    },

    // --- BPMN estándar ---
    'create.start-event': createAction(
      'bpmn:StartEvent', 'event', 'bpmn-icon-start-event-none'
    ),
    'create.intermediate-event': createAction(
      'bpmn:IntermediateThrowEvent', 'event', 'bpmn-icon-intermediate-event-none'
    ),
    'create.end-event': createAction(
      'bpmn:EndEvent', 'event', 'bpmn-icon-end-event-none'
    ),
    'create.exclusive-gateway': createAction(
      'bpmn:ExclusiveGateway', 'gateway', 'bpmn-icon-gateway-xor'
    ),
    'create.task': createAction(
      'bpmn:Task', 'activity', 'bpmn-icon-task'
    ),
    'create.subprocess-expanded': createAction(
      'bpmn:SubProcess', 'activity', 'bpmn-icon-subprocess-expanded', 'Create expanded SubProcess',
      { isExpanded: true }
    ),
    'create.participant-expanded': {
      group: 'collaboration',
      className: 'bpmn-icon-participant',
      title: 'Create Pool/Participant',
      action: {
        dragstart: createParticipant,
        click: createParticipant
      }
    }
  });

  return actions;
};
