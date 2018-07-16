#define R gl_TexCoord[0]
#define iTime gl_TexCoord[0].z
#define iBeat gl_TexCoord[0].w
#define PI (acos(-1.))
uniform sampler2D texCreds;
const vec2 rangeRainbow  = vec2(0, 9);
const vec2 rangeSkintone = vec2(16, 20);
const vec2 rangeMoon     = vec2(21, 28);
const vec2 rangeHalfMoon = vec2(21, 25);
const vec2 rangeBlack    = vec2(32, 32);
const vec2 rangeReds     = vec2(32, 35);
const vec2 rangeBooks    = vec2(40, 44);
const vec2 rangePinks    = vec2(52, 55);

vec2 rotate(vec2 p,float a){return cos(a)*p+sin(a)*vec2(-p.y,p.x);}

// custom emoji range encoder
float encode(vec3 params)
{
	// x = gradient value
	// y = range min
	// z = range max
	return (floor(mix(params.y, params.z + .99, clamp(params.x,0.,1.))) + .5) / 64.;
}

float sdDonut(vec3 p)
{
	float angle = iBeat * .5;
	p.xy = rotate(p.xy, angle);
	p.xz = rotate(p.xz, angle);
	p.yz = rotate(p.yz, angle);
	vec2 t = vec2(1.5,.5);
	vec2 q = vec2(length(p.xz)-t.x,p.y);
	return length(q)-t.y;
}

float hash(float seed)
{
	return fract(sin(seed)*43758.5453 );
}

float hash2(vec2 seed)
{
	return hash(seed.x+seed.y*137.31);
}

vec2 hash12(float seed)
{
	return vec2(hash(seed),hash(seed+1.));
}

vec3 fizzer(vec3 params, float weight)
{
	vec3 ran = fract(vec3((gl_FragCoord.xy)+iBeat*8.,hash2(gl_FragCoord.xy+iBeat*8.)));
	ran = vec3(ran.z,29,31);
	return hash2(gl_FragCoord.yx) < weight ? ran : params;
}

float mlength(vec2 a)
{
	a=abs(a);
	return (a.x+a.y);
}

float cube(vec3 p, vec3 b)
{
	vec3 d = abs(p) - b;
	return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}

float sdCircle(vec2 p, float r)
{
	return length(p)-r;
}

float smin( float a, float b, float k )
{
	float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
	return mix( b, a, h ) - k*h*(1.0-h);
}

float sdGrid(vec3 p)
{
	vec3 c = vec3(3.);
	p = mod(p,c)-0.5*c;
	
	float cyx = cube(p, vec3(0.15, 0.15, 2.5));
	float cyy = cube(p, vec3(0.15, 2.5, 0.15));
	float cyz = cube(p, vec3(2.5, 0.15, 0.15));

	return min(min(cyx,cyy),cyz);

	float d = length(p)-1.2;
}

float sdCube(vec3 p)
{
	float angle = iBeat * .5;
	p.xy = rotate(p.xy, angle);
	p.xz = rotate(p.xz, angle);
	p.yz = rotate(p.yz, angle);
	return cube(p, vec3(.9))-.3;
}

vec3 stereographic(vec2 uv)
{
	return vec3(
		(uv.xy*2.)/(1.+dot(uv.xy,uv.xy)),
		(-1.+uv.x*uv.x+uv.y*uv.y)/(1.+uv.x*uv.x+uv.y*uv.y)
	);
}

void sceneDualCircles(vec2 uv, out vec3 params)
{
	uv *= .1+fract(iBeat*.0625*.5)*3.5;
	vec3 p=stereographic(uv);
	
	params = vec3(fract(p.x*2.+iBeat),rangeMoon);
}

void sceneDualCircles2(vec2 uv, out vec3 params)
{
	vec3 p=stereographic(uv*3.);

	p.xz=mod(rotate(p.xz,iBeat*.5),1.)-.5;

	params= vec3(
		sign(p.x*p.y*p.z),
		vec2(29,31)
	);
}

void sceneOutrunGrid(vec2 uv, out vec3 params)
{
	uv.y = -abs(uv.y);
	uv.y-=.25;
	vec3 cam = vec3(0,1,0);
	vec3 dir = normalize(vec3(uv,1));

	dir.xz = rotate(dir.xz,sin(iBeat*.2)*2.);
	cam.x += iBeat;

	float t = cam.y / -dir.y;
	vec3 hit = cam+dir*t;

	hit = floor(hit);

	float a = clamp(1.3/t+.1,0.,1.);
	params.x = mod(hit.x+hit.z,2.)<1.?a:0.;
	params.yz = rangePinks;
}

void sceneRoad(vec2 uv, out vec3 params)
{
	uv.y -= .4;

	vec3 cam = vec3(0,1,0);
	vec3 dir = normalize(vec3(uv,1));
	float t = cam.y / -dir.y;
	vec3 hit = cam+dir*t;
	
	hit.x += sin(hit.z+iBeat)*.3;
	hit.x += sin(iBeat-1.9)*.3;
	hit.z *= 2.;
	hit.z += iBeat*2.;

	vec3 grass = vec3(1.-length(sin(hit.xz*2.))/sqrt(2.), 56,57);
	vec3 road = vec3(.5+normalize(sin(hit.z*PI))*.5, 58, 59);
	vec3 redwhite = vec3(.5+normalize(sin(hit.z*PI*2.))*.5, 31, 35);
	vec2 skyUv = uv*2.+vec2(1,0.37);
	float skyr = length(skyUv);
	vec3 sky = vec3(
		clamp(skyr*1.4-.1,0.,1.),
		60,
		62
	);
	if (skyr < .16)
		sky = vec3(0,63,63);


	if(uv.y > -.2)
		params = sky;
	else if(abs(hit.x)<.8)
		params = road;
	else if(abs(hit.x)<.9)
		params = redwhite;
	else
		params = grass;
}

void sceneRainbowPlasma(vec2 uv, vec2 screenUv, out vec3 params)
{
	float b = iBeat * .25;
	float scale = cos(b)*.5+1.;
	uv *= scale;
	params.x = fract(length(sin(rotate(uv*5.,b)))/sqrt(2.)+b);
	params.yz = rangeRainbow;
	
	if(iBeat >= 95.5
	||(iBeat >= 95. && screenUv.x < .83)
	||(iBeat >= 94.5 && screenUv.x < .67)
	||(iBeat >= 93.5 && screenUv.x < .5)
	||(iBeat >= 92.5 && screenUv.x < .33)
	||(iBeat >= 92. && screenUv.x < .17))
		params.yz = rangeBlack;
}

void sceneSquareTunnel(vec2 uv, out vec3 params)
{
	if (iBeat >= 48.){
		uv = abs(uv);
		uv=vec2(max(uv.x,uv.y),min(uv.x,uv.y));
	}
	
	uv = rotate(uv,iBeat*.125);
	params.x = fract(1./mlength(uv*2.)+iBeat);
	params.yz = iBeat < 48. ? vec2(29,31) : rangeBooks;
	if(mlength(uv)<.2)
		params.yz = rangeBlack;
}

void sceneCredits(vec2 uv, vec2 screenUv, out vec3 params)
{
	params = vec3(
		clamp(sin(uv.x*16. - 12.*uv.y - 2.*iBeat*sign(uv.y))*uv.y+.3,0.,1.),
		52,53
	);

	params.x = sin(mlength(uv)*15.+iBeat*2.*sign(uv.x*uv.y))*.5+.5;

	float cw = -cos((mod(iBeat-32.,64.)/32.)*PI);
	cw = min(cw * 3., 1.);
	if(texture2D(texCreds,screenUv).r < .5 && hash2(gl_FragCoord.xy) < cw)
	{
		params=vec3(0,39,39);
	}
}

void sceneCube(vec2 uv, out vec3 params)
{
	vec3 dir = normalize(vec3(uv.x, uv.y, 1.));
	vec3 ray=vec3(0,0,-5.);
	float t=0.0;
	float k = 0.;
	for(int i=0;i<32;i++)
	{
		k=sdCube(ray+dir*t);
		t+=k*0.75;
	}
	vec3 hit=ray+dir*t;
	vec2 h=vec2(-0.002,0.0);
	vec3 n=normalize(vec3(sdCube(hit+h.xyy),sdCube(hit+h.yxy),sdCube(hit+h.yyx)));
	float color = .0;
	params = vec3(0,rangeBlack);
	if(abs(k)<.001)
	{
		vec2 range = rangeSkintone;
		if(iBeat >= 158.) {
			range = hash12(floor(iBeat*4.))*63.;
		}
		vec3 light = vec3(-.5,-.5,1);
		color = max(0.,dot(n,normalize(light)));
		params = vec3(
			color*color + hash2(gl_FragCoord.xy)*.3,
			range
		);
	}
}

void sceneFirePlasma(vec2 uv, out vec3 params)
{
	uv.x=abs(uv.x);
	float t = iBeat*.4;
	float a = sin(dot(uv,vec2(cos(t),sin(t)))*5.);
	float b = sin(length(uv+sin(t)*.3)*8.-t*2.);
	params = vec3(
		((a+b)*.25+.5)*.85+hash2(gl_FragCoord.xy)*.15,
		10,15
	);
}

void sceneRedSDF(vec2 uv, out vec3 params)
{
	// biggest hack in the prod ;D
	float moontoggle = iBeat > 256. ? 0. : 10000.;
	vec3 dir = normalize(vec3(uv.xy, 1.));
	dir.xy=rotate(dir.xy,-iBeat*0.15);
	dir.zx=rotate(dir.zx,-iBeat*0.15);
	vec3 ray=vec3(1.,1.,iBeat);
	float t=0.0;
	float k = 0.;
	for(int i=0;i<32;i++)
	{
		k=min(sdGrid(ray+dir*t),sdGrid(ray+dir*t+1.5)+moontoggle);
		t+=k*0.75;
	}
	vec3 hit=ray+dir*t;
	vec2 h=vec2(-0.002,0.);
	vec3 n=normalize(vec3(
		min(sdGrid(hit+h.xyy),sdGrid(hit+h.xyy+1.5)+moontoggle),
		min(sdGrid(hit+h.yxy),sdGrid(hit+h.yxy+1.5)+moontoggle),
		min(sdGrid(hit+h.yyx),sdGrid(hit+h.yyx+1.5)+moontoggle)
	));
	float distanc = length(hit-ray);
	float attenDist = 12.0;
	float atten = max(0.0, attenDist-distanc)/attenDist;
	vec3 light = ray;
	float color = atten * dot(n, normalize(hit-light));
	params.x = clamp(color*1.5,0.,1.);
	params.yz = sdGrid(hit+1.5)+moontoggle < .1 ? rangeHalfMoon : rangeReds;
}

// recycle from last demo lol
vec2 checker_checkerboard(vec2 uv){
	uv=floor(abs(uv)*1.-.5);
	if(mod(uv.x+uv.y,2.)<1.)
		return vec2(0.);
	return vec2(1.);
}
vec2 checker_uvs(vec2 uv, float z){
	uv.x+=sin(iTime+z*.3)*.2;
	uv.x-=sin(iTime+.0)*.2;
	uv.y+=cos(iTime*.7+z*.2)*.2;
	uv.y-=cos(iTime*.7+.0)*.2;
	return uv*pow(2.,z);
}

void sceneChecker(vec2 uv, out vec3 params)
{
	for(int I=0;I<20;I++){
		float z=float(I)-fract(iBeat);
		vec2 d=checker_checkerboard(checker_uvs(uv,z));
		if(d.y>.5)
		{
			params=vec3(fract((float(I)+floor(iBeat))/5.),rangeRainbow);
			return;
		}
	}
	params = vec3(0, rangeBlack);
}

void sceneMatrix(vec2 screenUv, out vec3 params)
{
	float speed = hash(screenUv.x)*.5+.2;
	float y = fract(screenUv.y + speed*iBeat);
	params = vec3(.05/y,36,38);
}

void main()
{
	vec2 screenUv = gl_FragCoord.xy / R.xy;
	vec2 uv = screenUv - .5;
	uv.x *= R.x/R.y;

	vec3 params=vec3(0);
	if (iBeat < 32.)
	{
		float d = length(uv)-.5;
		if(iBeat > 1.)
		{
			float sm = max(
				length(uv)-.35,
				.39-length(uv-vec2(0,.1))
			);
			d=max(d,-sm);
		}
		if(iBeat > 2.)
		{
			float e = length(uv-vec2(-.19,.15))-.08;
			d = max(d,-e);
		}
		if(iBeat > 3.)
		{
			float e = length(uv-vec2(.19,.15))-.08;
			d = max(d,-e);
		}

		params = vec3(-d*10.+.4,36,38);

		float w= clamp((iBeat-16.)/14.,0.,1.);
		params = fizzer(params,w*w);
	}
	else if (iBeat < 64.)
	{
		sceneSquareTunnel(uv, params);
	}
	else if (iBeat < 96.)
	{
		sceneRainbowPlasma(uv, screenUv, params);
	}
	else if (iBeat < 128.)
	{
		sceneRoad(uv, params);
	}
	else if (iBeat < 160.)
	{
		sceneCube(uv, params);
	}
	else if (iBeat < 192.)
	{
		sceneMatrix(screenUv, params);
	}
	else if (iBeat < 224.)
	{
		sceneDualCircles(uv, params);
	}
	else if (iBeat < 288.)
	{
		sceneRedSDF(uv, params);
	}
	else if (iBeat < 352.)
	{
		sceneCredits(uv, screenUv, params);
		float w= clamp((iBeat-340.)/10.,0.,1.);
		params = fizzer(params,w*w);
	}
	else if (iBeat < 384.)
	{
		sceneOutrunGrid(uv, params);
	}
	else if (iBeat < 416.)
	{
		sceneDualCircles2(uv, params);
	}
	else if (iBeat < 448.)
	{
		sceneChecker(uv, params);
	}
	else if (iBeat < 480.)
	{
		sceneFirePlasma(uv,params);
	}
	else
	{
		params.yz = rangeBlack;
	}
	

	gl_FragColor.r = encode(params);
}