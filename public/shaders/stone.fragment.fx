precision highp float;

varying vec2 vUV;

uniform sampler2D stoneTexture;
uniform sampler2D detailTexture;
uniform float time;

void main() {
    vec2 uv = vUV;
    
    // Sample base stone texture
    vec4 stoneColor = texture2D(stoneTexture, uv * 2.0);
    
    // Sample detail texture at a different scale
    vec4 detailColor = texture2D(detailTexture, uv * 4.0);
    
    // Mix the textures
    vec4 mixedColor = mix(stoneColor, detailColor, 0.3);
    
    // Add some variation to create a more natural stone look
    float variation = (mixedColor.r + mixedColor.g + mixedColor.b) / 3.0;
    variation = pow(variation, 1.2); // Adjust contrast
    
    // Final color adjustment for stone-like appearance
    vec3 finalColor = vec3(0.4 + variation * 0.2);
    
    // Add slight color variation for more natural look
    finalColor.r *= 1.02;
    finalColor.b *= 0.98;
    
    gl_FragColor = vec4(finalColor, 1.0);
}