#ifdef GL_ES
precision mediump float;
#endif


// grab texcoords from vert shader
varying vec2 vTexCoord;

// our texture coming from p5
uniform sampler2D tex0;

// the entered fade value from 0 to 8 (0 is normal, 8 is fully black)
uniform float fadeValue; 
uniform int u_multiplier;
uniform vec2 u_texSize;

void main() {
    vec2 flippedTexCoord = vTexCoord;

    // the texture is loaded upside down and backwards by default so lets flip it
    flippedTexCoord.y = 1.0 - flippedTexCoord.y;

    // NEW STUFF
    vec2 texCoordScaled = floor(flippedTexCoord * u_texSize);
    // vec2 texCoordNearest = floor(texCoordScaled / float(u_multiplier)) ;
    vec2 texCoordNearest = floor(texCoordScaled) ;
    vec2 texCoordFinal = (texCoordNearest + vec2(0.5)) / (u_texSize); // the + vec2(0.5) is what makes this nearest neighbor. it chooses the pixel that doesn't have interpolation
    vec4 textColor = texture2D(tex0, texCoordFinal);

    

    // END NEW STUFF

    // UNCOMMENT THIS IF THINGS GO AWRY
    // vec4 textColor = texture2D(tex0, flippedTexCoord);

    // --------------------------- BEGIN SUBTRACTION FADE ----------------------
    float modifiedFade = min(1.0, fadeValue / 8.0); // normalize fadeValue to 0 to 1 range
    
    textColor.rgb -= modifiedFade; // subtraction fade
    textColor.rgb = max(textColor.rgb, 0.0); // clamp the colors between 0 to 1
    
    gl_FragColor = textColor;
}


/*


// THIS WORKS
void main() {
    vec2 uv = vTexCoord;

    // the texture is loaded upside down and backwards by default so lets flip it
    uv.y = 1.0 - uv.y;

    vec4 tex = texture2D(tex0, uv);

    // just invert the colors for funsies :]
    vec3 tex_inv = vec3(1.0 - tex.r, 1.0 - tex.g, 1.0 - tex.b);

    // render the output
    gl_FragColor = vec4(tex_inv.rgb, 1.0);
}



*/

