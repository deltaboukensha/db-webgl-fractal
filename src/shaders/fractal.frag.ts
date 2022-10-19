const source = () => `#version 300 es
precision mediump float;
in vec2 st;
out vec4 fragment;
uniform uint elapsedTime;

#define M_PI 3.1415926535897932384626433832795
float focalLength = 1.0;

struct Ray {
  vec3 originPoint;
  vec3 directionVector;
};

struct Plane {
  vec3 originPoint;
  vec3 normalVector;
};

struct Intersection {
  bool hit;
  vec3 point;
  //bool infinite
  //bool zero
  //bool reverse or what is a better name?
};

// https://www.scratchapixel.com/lessons/3d-basic-rendering/minimal-ray-tracer-rendering-simple-shapes/ray-plane-and-ray-disk-intersection#:~:text=Ray%2DPlane%20Intersection&text=Note%20that%20the%20plane%20and,case%20there%20is%20no%20intersection.
// We want to find the intersection.point of the ray and the plane if they do intersect
// the intersection.point is unknown and we will calculate it
// if it is a hit then the intersection.point - plane.originPoint forms a vector that lies on the plane
// then the dot product of the vector on the plane and normal will be zero because they are perpendicular to each other
// so we know that the following equation must be true if its a hit
// A: (intersection.point - plane.originPoint) dot (plane.normalVector) = 0
// a ray that hits the plane can be defined as the following equation
// B: ray.originPoint + ray.directionVector * rayMultiplier = intersection.point
// using substitution of equation A with B we get
// C: (ray.originPoint + ray.directionVector * rayMultiplier - plane.originPoint) dot (plane.normalVector) = 0
// solving for the rayMultiplier we get
// D: (ray.originPoint - plane.originPoint) dot plane.normalVector + (ray.directionVector * rayMultiplier) dot plane.normalVector = 0
// E: (ray.directionVector * rayMultiplier) dot plane.normalVector = - (ray.originPoint - plane.originPoint) dot plane.normalVector
// F: rayMultiplier = ( - (ray.originPoint - plane.originPoint) dot plane.normalVector ) / (ray.directionVector dot plane.normalVector)
// G: rayMultiplier = ( (plane.originPoint - ray.originPoint) dot plane.normalVector ) / (ray.directionVector dot plane.normalVector)

bool isAlmostPerpendicular(vec3 a, vec3 b){
  return dot(a, b) < 1e-9;
}

Intersection findIntersection(Ray ray, Plane plane) {
  Intersection intersection = Intersection(false, vec3(0, 0, 0));

  if(isAlmostPerpendicular(plane.normalVector, ray.directionVector)){
    intersection.hit = false;
    // TODO check if there are infinite hits is the rayOrigin on the plane?
    return intersection;
  }

  float rayMultiplier = dot(plane.originPoint - ray.originPoint, plane.normalVector) / dot(ray.directionVector, plane.normalVector);
  intersection.hit = rayMultiplier >= 0.0f; // exclude ray that hit in negative direction
  intersection.point = rayMultiplier * ray.directionVector;
  return intersection;
}

void main() {
  vec3 eye = vec3(0, 0, 0);
  Ray ray = Ray(eye, vec3(st.s, st.t, focalLength) - eye);
  Plane plane = Plane(vec3(0, 0, 10), vec3(2, 5, 1));
  Intersection intersection = findIntersection(ray, plane);
  fragment = vec4(intersection.hit, sin(float(elapsedTime) * 0.001f), 0, 1);
}
`;

export default source;
