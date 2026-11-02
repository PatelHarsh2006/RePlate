
const getDistance = async (coordinates) => {
  const coordinateString = coordinates
    .map(point => `${point[0]},${point[1]}`)
    .join(";");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `https://router.project-osrm.org/table/v1/driving/${coordinateString}?annotations=distance,duration`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error("OSRM table request failed");
    }

    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !Array.isArray(data.distances) ||
      !Array.isArray(data.durations)
    ) {
      throw new Error("Invalid OSRM table response");
    }

    return {
      distances: data.distances,
      durations: data.durations,
      source: "OSRM"
    };
  } finally {
    clearTimeout(timeout);
  }
};

const getFallbackMatrix = (coordinates) => {
  const distances = [];
  const durations = [];

  for (let i = 0; i < coordinates.length; i++) {
    distances[i] = [];
    durations[i] = [];

    for (let j = 0; j < coordinates.length; j++) {
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[j];

      const toRadians = value => value * Math.PI / 180;

      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

      const greatCircleDistance =
        6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const roadDistance = greatCircleDistance * 1.4;

      distances[i][j] = roadDistance * 1000;
      durations[i][j] = (roadDistance / 30) * 3600;
    }
  }

  return {
    distances,
    durations,
    source: "fallback"
  };
};

const getDistanceMatrix = async (coordinates) => {
  try {
    return await getDistance(coordinates);
  } catch (error) {
    console.error("OSRM unavailable, using fallback:", error.message);
    return getFallbackMatrix(coordinates);
  }
};

const calculateRouteDistance = (route, distances) => {
  let total = 0;

  for (let i = 0; i < route.length - 1; i++) {
    total += distances[route[i]][route[i + 1]];
  }

  return total;
};

const nearestNeighbour = (distances) => {
  const totalPoints = distances.length;
  const unvisited = new Set();

  for (let i = 1; i < totalPoints; i++) {
    unvisited.add(i);
  }

  const route = [0];
  let current = 0;

  while (unvisited.size > 0) {
    let nearest = null;
    let shortestDistance = Infinity;

    for (const point of unvisited) {
      if (distances[current][point] < shortestDistance) {
        shortestDistance = distances[current][point];
        nearest = point;
      }
    }

    route.push(nearest);
    unvisited.delete(nearest);
    current = nearest;
  }

  return route;
};

const twoOpt = (initialRoute, distances) => {
  let route = [...initialRoute];
  let improved = true;

  while (improved) {
    improved = false;

    for (let i = 1; i < route.length - 1; i++) {
      for (let j = i + 1; j < route.length; j++) {
        const newRoute = [...route];

        const reversedSegment = newRoute.slice(i, j + 1).reverse();
        newRoute.splice(i, reversedSegment.length, ...reversedSegment);

        if (
          calculateRouteDistance(newRoute, distances) <
          calculateRouteDistance(route, distances)
        ) {
          route = newRoute;
          improved = true;
        }
      }
    }
  }

  return route;
};

const optimizeRoute = (distances) => {
  const initialRoute = nearestNeighbour(distances);
  const optimizedRoute = twoOpt(initialRoute, distances);

  return {
    initialRoute,
    optimizedRoute,
    totalDistance: calculateRouteDistance(optimizedRoute, distances)
  };
};

const getRouteGeometry = async (coordinates) => {
  const coordinateString = coordinates
    .map(point => `${point[0]},${point[1]}`)
    .join(";");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinateString}?overview=full&geometries=geojson`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error("OSRM route request failed");
    }

    const data = await response.json();

    if (
      data.code !== "Ok" ||
      !data.routes ||
      !data.routes.length
    ) {
      throw new Error("Invalid OSRM route response");
    }

    return {
      geometry: data.routes[0].geometry,
      distance: data.routes[0].distance,
      duration: data.routes[0].duration
    };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  getDistanceMatrix,
  optimizeRoute,
  getRouteGeometry
};
