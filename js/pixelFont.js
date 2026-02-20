import {startMeasuringExecutionTime, finishMeasuringExecutionTime} from './fpsCounter.js';

let font_image;
let font_image_w_border;

let fonts = [];


let current_font = 0;

export function preloadPixelFont() {
  font_image = loadImage('img/gbfont.png');
  font_image_w_border = loadImage('img/gbfont_blackborder.png');
}

export function setupPixelFont() {
  // MAKE alternate colors for the font
  let gb_black_image = create_colored_font_from_black_font(font_image, 0);
  let gb_dark_grey_image = create_colored_font_from_black_font(font_image, 128);
  let gb_light_grey_image = create_colored_font_from_black_font(font_image, 192);
  let gb_white_image = create_colored_font_from_black_font(font_image, 255);

  fonts = [
    {
      name: 'black',
      characterArray: extractCharactersFromImage(gb_black_image),
      line_height: 12,
    },
    {
      name: 'dkgray',
      characterArray: extractCharactersFromImage(gb_dark_grey_image),
      line_height: 12,
    },
    {
      name: 'ltgray',
      characterArray: extractCharactersFromImage(gb_light_grey_image),
      line_height: 12,
    },
    {
      name: 'white',
      characterArray: extractCharactersFromImage(gb_white_image),
      line_height: 12,
    },
    {
      name: 'white_w_black_border',
      characterArray: extractCharactersFromImage(font_image_w_border),
      line_height: 12,
    },
  ];
}

function create_colored_font_from_black_font(black_font, color) {
  let colored_font_image = black_font.get();
  colored_font_image.loadPixels();

  // just replace all the black pixels with white ones lol
  for (let x = 0; x < colored_font_image.width; x++) {
    for (let y = 0; y < colored_font_image.height; y++) {
      let index = (x + y * colored_font_image.width) * 4;
      let r = colored_font_image.pixels[index];
      let g = colored_font_image.pixels[index + 1];
      let b = colored_font_image.pixels[index + 2];

      if (r === 0 && g === 0 && b === 0) {
        colored_font_image.pixels[index] = color;
        colored_font_image.pixels[index + 1] = color;
        colored_font_image.pixels[index + 2] = color;
      }
    }
  }

  colored_font_image.updatePixels();
  return colored_font_image;
}

function extractCharactersFromImage(img) {
  // create an array to store the individual characters
  let characters = [];
  img.loadPixels();

  // get the width and height of the image
  let width = img.width;
  let height = img.height;

  // get the pixels array from the image
  let pixels = img.pixels;

  // initialize the start and end coordinates for the character image
  let startX = -1;
  let endX = 0;

  // iterate through the top row of pixels
  for (let x = 0; x < width; x++) {
    // calculate the index of the current pixel in the pixels array
    let index = (x + 0 * width) * 4;

    // check if the pixel is magenta (255, 0, 255)
    if (pixels[index] === 255 && pixels[index + 1] === 0 && pixels[index + 2] === 255) {
      // set the endX coordinate to the previous x coordinate
      endX = x;

      // check if the startX coordinate has been set
      if (startX >= 0) {
        // extract the character image using the startX and endX coordinates, and the y coordinates 1 and 12
        let characterImg = img.get(startX, 1, endX - startX, 12);
        // push the character image to the array
        characters.push(characterImg);
      }

      // set the startX coordinate to the current x coordinate
      startX = x;
    }
  }

  // return the array of character images
  return characters;
}


function getCharacterImage(character) {
  // ASCII codes for space and tilde characters
  const spaceCode = 32;
  const tildeCode = 126;

  // Convert the character to its ASCII code
  const charCode = character.charCodeAt(0);

  // Check if the character is within the range of ASCII codes for the images in characterImageArray
  if (charCode >= spaceCode && charCode <= tildeCode) {
    // If it is, return the corresponding element in characterImageArray
    return fonts[current_font].characterArray[charCode - spaceCode];
  } else {
    // If it isn't, return null
    return null;
  }
}


// this function must be bound to a p5.Graphics object. it will call that object's image function.

export function drawSentence(sentence, x, y) {
  const leftX = x; // keep track of the left edge for newlines
  for (let i = 0; i < sentence.length; i++) {
    const character = sentence[i];
    if (character === '\n') {
      x = leftX; // reset x to the left
      y += fonts[current_font].line_height; // increment y by the line_height of the current font
      continue; // skip the rest of the loop and go to the next iteration
    }
    const img = getCharacterImage(character);
    if (img) {
      // call image() on the p5 graphics object that this function is bound to
      this.image(img, x, y);
      const one_pixel_border = current_font === 4 ? 1 : 0;
      x += img.width - one_pixel_border; // increment x by the width of the image
    }
  }
}

export function drawSentenceWithBlackBorder(sentence, x, y) {
  const old_font = current_font;






  this.changeFont('white_w_black_border');
  this.drawSentence(sentence, x, y);
  this.changeFont(old_font);






  // this.changeFont('black');
  // this.drawSentence(sentence, x + 0, y + 1);
  // this.drawSentence(sentence, x + 1, y + 1);
  // this.drawSentence(sentence, x + 1, y + 1);
  // this.changeFont(old_font);
  // this.drawSentence(sentence, x + 1, y + 0);

}

export function changeFont(newFont) {
  if (current_font === newFont) {
    return;
  }
  if (typeof newFont === 'string') {
    if (current_font.name === newFont) {
      return;
    }
    // search for font by name
    const font = fonts.find(f => f.name === newFont);
    if (font) {
      current_font = fonts.indexOf(font);
    } else {
      console.error('Error: font not found');
      console.error(font)
    }
  } else if (typeof newFont === 'number') {
    // check if the index is within range
    if (newFont >= 0 && newFont < fonts.length) {
      current_font = newFont;
    } else {
      console.error('Error: font index out of range');
    }
  } else {
    console.error('Error: invalid input when trying to change font');
  }
};
