const source = () => `#version 300 es
precision mediump float;
in vec2 st;
out vec4 fragment;
uniform uint elapsedTime;
uniform vec3 eyeOriginPoint;

#define MATH_PI 3.1415926535897932384626433832795
#define COLOR_BLACK vec3(0, 0, 0)
#define COLOR_GREEN vec3(0, 1, 0)
float focalLength = 1.0;

struct Ray {
  vec3 originPoint;
  vec3 directionVector;
};

struct Plane {
  vec3 originPoint;
  vec3 normalVector;
};

struct Circle {
  vec3 originPoint;
  vec3 normalVector;
  float radius;
};

struct Sphere {
  vec3 originPoint;
  float radius;
};

struct Sun {
  vec3 originPoint;
};

struct Intersection {
  bool hit;
  vec3 point;
  //bool infinite
  //bool zero
  //bool reverse or what is a better name?
};

struct World {
  Circle circle;
  Sphere sphere[3];
  Sun sun;
};

struct Job {
  Ray eyeRay;
  World world;
};

struct Result {
  bool done;
  Job job;
  vec3 color;
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
    // TODO recode this conditional if and remove it to improve performance?
    return intersection;
  }

  float rayMultiplier = dot(plane.originPoint - ray.originPoint, plane.normalVector) / dot(ray.directionVector, plane.normalVector);
  intersection.hit = rayMultiplier >= 0.0f; // exclude ray that hit in negative direction
  intersection.point = rayMultiplier * ray.directionVector;
  return intersection;
}

Intersection findIntersection(Ray ray, Circle circle) {
  Intersection intersection = findIntersection(ray, Plane(circle.originPoint, circle.normalVector));
  intersection.hit = intersection.hit && length(intersection.point - circle.originPoint) <= circle.radius;
  return intersection;
}

// https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
Intersection findIntersection(Ray ray, Sphere sphere) {
  vec3 o = ray.originPoint;
  vec3 u = normalize(ray.directionVector); // same as û
  vec3 c = sphere.originPoint;
  float r = sphere.radius;
  
  float delta = dot(u, o - c) * dot(u, o - c) - (length(o - c) * length(o - c) - r * r);
  
  // if(delta < 0) // no solutions
  // if(delta == 0) // exactly one solution
  // if(delta > 0) // exactly two solutions

  if(delta > 0.0f) {
    float d1 = -dot(u, o - c) - sqrt(delta);
    float d2 = -dot(u, o - c) + sqrt(delta);
    return Intersection(true, o + d1 * u);
  }

  return Intersection(false, vec3(0, 0, 0));
}

vec4 findColor(Ray ray, Intersection intersection, Circle circle) {
  return vec4(1, 0, 0, 1);
}

// Phong reflection model
vec3 findColor(Ray ray, Intersection intersection, Sphere sphere, Sun sun) {
  vec3 N = normalize(intersection.point - sphere.originPoint);
  vec3 L = normalize(intersection.point - sun.originPoint);
  vec3 V = normalize(intersection.point - ray.originPoint);
  vec3 R = reflect(L, N);
  // ambient
  // diffuse
  // specular

  // Lambertian shading
  vec3 lambertian = 1.0f * vec3(1, 0, 0) * max(0.0f, dot(N, L));
  return lambertian;
}

Result runJob(Job job){
  // Intersection intersection = findIntersection(job.eyeRay, job.world.circle);
  
  // if(intersection.hit) {
  //   vec4 color = findColor(job.eyeRay, intersection, job.world.circle);
  //   return Result(true, job, color);
  // }

  for(int i=0; i<job.world.sphere.length(); i++){
    Sphere sphere = job.world.sphere[i];
    Intersection intersection = findIntersection(job.eyeRay, sphere);
    if (intersection.hit) {
      vec3 color = findColor(job.eyeRay, intersection, sphere, job.world.sun);

      Ray newRay = Ray(intersection.point, job.eyeRay.directionVector);
      Job newJob = Job(newRay, job.world);
      return Result(true, newJob, color);
    }
  }
  
  return Result(true, job, COLOR_BLACK);
}

void main() {
  Ray eyeRay = Ray(eyeOriginPoint, vec3(st.s, st.t, focalLength));
  World world;
  world.circle = Circle(vec3(0, 0, 10), vec3(0, 0, 1), 10.0f);
  world.sphere[0] = Sphere(vec3(0, 0, 10), 1.0f);
  world.sphere[1] = Sphere(vec3(2, 0, 10), 1.0f);
  world.sphere[2] = Sphere(vec3(4, 0, 10), 1.0f);
  world.sun = Sun(vec3(100, -100, 100));
  Job job = Job(eyeRay, world);
  Result result = Result(false, job, COLOR_BLACK);

  for(int i=0; i<1; i++) {
    result = runJob(result.job);

    if(result.done) {
      fragment = vec4(result.color, 1.0f);
      return;
    }
  }

  fragment = vec4(0, 0, 0, 1.0f);
}
`;

export default source;
