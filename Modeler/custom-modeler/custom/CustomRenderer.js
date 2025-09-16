import inherits from 'inherits-browser';
import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  componentsToPath,
  createLine
} from 'diagram-js/lib/util/RenderUtil';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate
} from 'tiny-svg';

import { Scheduler } from './dataURL'; // 🆕 importante

const COLOR_RED = '#cc0000';

export default function CustomRenderer(eventBus, styles) {
  BaseRenderer.call(this, eventBus, 2000);

  const computeStyle = styles.computeStyle;

  this.drawCustomConnection = function(p, element) {
    const attrs = computeStyle({}, {
      stroke: COLOR_RED,
      strokeWidth: 2
    });

    return svgAppend(p, createLine(element.waypoints, attrs));
  };

  this.getCustomConnectionPath = function(connection) {
    const waypoints = connection.waypoints.map(p => p.original || p);

    const connectionPath = [
      ['M', waypoints[0].x, waypoints[0].y]
    ];

    waypoints.forEach((waypoint, index) => {
      if (index !== 0) {
        connectionPath.push(['L', waypoint.x, waypoint.y]);
      }
    });

    return componentsToPath(connectionPath);
  };

  this.drawScheduler = function(p, element) {
  const width = element.width || 100;
  const height = element.height || 80;

  const image = svgCreate('image');

  svgAttr(image, {
    href: Scheduler.dataURL,
    width: width,
    height: height,
    x: 0,
    y: 0
  });

  svgAppend(p, image);

  return image;
};


  this.getSchedulerPath = function(shape) {
    const { x, y, width, height } = shape;
    return `M${x},${y} h${width} v${height} h-${width} Z`;
  };
}

inherits(CustomRenderer, BaseRenderer);

CustomRenderer.$inject = ['eventBus', 'styles'];

CustomRenderer.prototype.canRender = function(element) {
  return /^custom:/.test(element.type);
};

CustomRenderer.prototype.drawShape = function(p, element) {
  const type = (element.type || '').toLowerCase();
  if (type === 'custom:scheduler') return this.drawScheduler(p, element);
  return null;
};
CustomRenderer.prototype.getShapePath = function(shape) {
  const type = (shape.type || '').toLowerCase();
  if (type === 'custom:scheduler') return this.getSchedulerPath(shape);
  return null;
};

CustomRenderer.prototype.drawConnection = function(p, element) {
  if (element.type === 'custom:connection') {
    return this.drawCustomConnection(p, element);
  }
};

CustomRenderer.prototype.getConnectionPath = function(connection) {
  if (connection.type === 'custom:connection') {
    return this.getCustomConnectionPath(connection);
  }
};
