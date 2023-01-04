const source = () => `#version 300 es
precision mediump float;
in vec2 st;
out vec4 fragment;
uniform uint elapsedTime;
uniform vec3 eyeOriginPoint;
uniform mat3 eyeRotationMatrix;

#define MATH_PI 3.1415926535897932384626433832795
vec3 COLOR_BACKGROUND = vec3(0, 0, 0);
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
  float fresnel = pow(1.0f - clamp(dot(N, V), 0.0f, 1.0f), 2.0f);
  return lambertian * fresnel * 8.0f;
}

Result runJob(Job job){
  for(int i=0; i<job.world.sphere.length(); i++){
    Sphere sphere = job.world.sphere[i];
    Intersection intersection = findIntersection(job.eyeRay, sphere);
    if (intersection.hit) {

      // color from sun to sphere reflection
      vec3 color = findColor(job.eyeRay, intersection, sphere, job.world.sun);

      // color from refraction
      vec3 normalVector = normalize(intersection.point - sphere.originPoint);
      if(dot(job.eyeRay.directionVector, normalVector) < 0.0f){
        vec3 refractionVector = refract(job.eyeRay.directionVector, normalVector, 1.0f/1.1f);
        Ray newRay = Ray(intersection.point, refractionVector);
        Job newJob = Job(newRay, job.world);
        return Result(false, newJob, color);
      } else {
        vec3 refractionVector = refract(job.eyeRay.directionVector, -normalVector, 1.1f);
        Ray newRay = Ray(intersection.point, refractionVector);
        Job newJob = Job(newRay, job.world);
        return Result(false, newJob, color);
      }
    }
  }
  
  return Result(true, job, COLOR_BACKGROUND);
}

void main() {
  Ray eyeRay = Ray(eyeOriginPoint, normalize(vec3(st.s, st.t, focalLength)) * eyeRotationMatrix);
  World world;
  world.sphere[0] = Sphere(vec3(0, 0, 10), 1.0f, vec3(1, 0, 0));
  world.sphere[1] = Sphere(vec3(+1, 0, 12), 1.0f, vec3(0, 1, 0));
  world.sphere[2] = Sphere(vec3(-1, 0, 14), 1.0f, vec3(0, 0, 1));
  world.sun = Sun(vec3(100, -100, 100));
  Job job = Job(eyeRay, world);
  Result result = Result(false, job, COLOR_BACKGROUND);
  vec3 color = result.color;

  for(int i=0; i<3; i++) {
    result = runJob(result.job);
    color = color + result.color;

    if(result.done) {
      break;
    }
  }

  fragment = vec4(color, 1.0f);
}
`;

export default source;
