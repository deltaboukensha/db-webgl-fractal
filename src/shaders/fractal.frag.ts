const source = () => `#version 300 es
precision mediump float;
in vec2 st;
out vec4 fragment;
uniform uint elapsedTime;
uniform vec3 eyeOriginPoint;
uniform mat3 eyeRotationMatrix;

#define MATH_PI 3.1415926535897932384626433832795
#define COLOR_BLACK vec3(0, 0, 0)
#define COLOR_GREEN vec3(0, 1, 0)
float focalLength = 1.0;

struct Ray {
  vec3 originPoint;
  vec3 directionVector;
};

struct Sphere {
  vec3 originPoint;
  float radius;
  vec3 color;
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
  Sphere sphere[3];
  Sun sun;
};

struct Job {
  Ray eyeRay;
  World world;
  int skipIndex;
};

struct Result {
  bool done;
  Job job;
  vec3 color;
};

// https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
Intersection findIntersection(Ray ray, Sphere sphere) {
  vec3 o = ray.originPoint;
  vec3 u = normalize(ray.directionVector); // same as û
  vec3 c = sphere.originPoint;
  float r = sphere.radius;
  
  float delta = dot(u, o - c) * dot(u, o - c) - (length(o - c) * length(o - c) - r * r);
  
  if(delta < 0.0f) {
    return Intersection(false, vec3(0, 0, 0));
  }

  float d1 = -dot(u, o - c) - sqrt(delta);
  float d2 = -dot(u, o - c) + sqrt(delta);
  float d = max(d1,d2);

  if(d < 0.01f){
    return Intersection(false, vec3(0, 0, 0));
  }

  return Intersection(true, o + d * u);
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
  vec3 lambertian = 1.0f * sphere.color * max(0.0f, dot(N, L));

  // Fresnel effect
  float fresnel = pow(1.0f - clamp(dot(N, V), 0.0f, 1.0f), 3.0f);
  return lambertian * fresnel;
}

Result runJob(Job job){
  for(int i=0; i<job.world.sphere.length(); i++){
    if(job.skipIndex == i) continue;

    Sphere sphere = job.world.sphere[i];
    Intersection intersection = findIntersection(job.eyeRay, sphere);
    if (intersection.hit) {
      vec3 color = findColor(job.eyeRay, intersection, sphere, job.world.sun);

      vec3 normalVector = normalize(intersection.point - sphere.originPoint);
      vec3 refractionVector = refract(job.eyeRay.directionVector, normalVector, 1.1f);
      Ray newRay = Ray(intersection.point, refractionVector);
      Job newJob = Job(newRay, job.world, i);
      return Result(false, newJob, color);
    }
  }
  
  return Result(true, job, COLOR_BLACK);
}

void main() {
  Ray eyeRay = Ray(eyeOriginPoint, normalize(vec3(st.s, st.t, focalLength)) * eyeRotationMatrix);
  World world;
  world.sphere[0] = Sphere(vec3(0, 0, 10), 1.0f, vec3(1, 0, 0));
  world.sphere[1] = Sphere(vec3(+1, 0, 12), 1.0f, vec3(0, 1, 0));
  world.sphere[2] = Sphere(vec3(-1, 0, 14), 1.0f, vec3(0, 0, 1));
  world.sun = Sun(vec3(100, -100, 100));
  Job job = Job(eyeRay, world, -1);
  Result result = Result(false, job, COLOR_BLACK);
  fragment = vec4(0, 0, 0, 1.0f);

  for(int i=0; i<1; i++) {
    result = runJob(result.job);
    fragment = mix(fragment, vec4(result.color, 1.0f), 0.5f);

    if(result.done) {
      return;
    }
  }
}
`;

export default source;
