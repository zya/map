'use strict';

var _ = require('lodash');
var Delaunay = require('faster-delaunay');

var findingMargin = 2;

function setConnectedToTrue(point) {
  point.connected = true;
}

function preparePointsForTriangulation(point) {
  return [point.x, point.y];
}

function isInRange(point, temporaryTriangles, index) {
  var isInXRange = point.x > temporaryTriangles[index][0] - findingMargin && point.x < temporaryTriangles[index][0] + findingMargin;
  var isInYRange = point.y > temporaryTriangles[index][1] - findingMargin && point.y < temporaryTriangles[index][1] + findingMargin;
  return isInXRange && isInYRange;
}

function shouldCreateConnection(pairs, idNormal, idReverse) {
  return !_.includes(pairs, idNormal) || !_.includes(pairs, idReverse);
}

function createConnection(pairs, connections, point1, point2) {
  var pairNormal = point1.id + point2.id;
  var pairReverse = point2.id + point1.id;

  if (shouldCreateConnection(pairs, pairNormal, pairReverse)) {
    connections.push({
      id: pairNormal,
      from: point1,
      to: point2
    });

    pairs.push(pairNormal);
  }
}

function updateConnections(points, pairs, connections, triangles) {
  if (points.length < 2) return;

  points.forEach(setConnectedToTrue);

  var pointsForTriangulation = points.map(preparePointsForTriangulation);
  var delaunay = new Delaunay(pointsForTriangulation);
  var temporaryTriangles = delaunay.triangulate();

  if (temporaryTriangles.length > 0) {
    for (var i = 0; i < temporaryTriangles.length; i += 3) {
      var anchorIndex = _.findIndex(points, _.partial(isInRange, _, temporaryTriangles, i));
      var firstPointIndex = _.findIndex(points, _.partial(isInRange, _, temporaryTriangles, i + 1));
      var secondPointIndex = _.findIndex(points, _.partial(isInRange, _, temporaryTriangles, i + 2));

      var anchor = points[anchorIndex];
      var firstPoint = points[firstPointIndex];
      var secondPoint = points[secondPointIndex];

      triangles.push([anchor, firstPoint, secondPoint]);

      createConnection(pairs, connections, anchor, firstPoint);
      createConnection(pairs, connections, anchor, secondPoint);
      createConnection(pairs, connections, firstPoint, secondPoint);
    }
  } else {
    createConnection(pairs, connections, points[0], points[1]);
  }

}

module.exports = updateConnections;