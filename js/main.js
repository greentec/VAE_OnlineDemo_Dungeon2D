var layer_defs, net;
var n_z = 800;
var firstFrame = true;
var input_w1, input_w2;
var firstSelectedIndex = -1;
var secondSelectedIndex = -1;


function getRandom() {
  var canvas;

  if (firstFrame == true) {
    canvas = document.getElementById('dungeonCanvas0');
    for (var i = 0; i < 800; i += 1) {
      input_w1[i] = rnd2();
    }

    canvas.width = canvas.width;
    drawToCanvas(canvas, input_w1, 0, 0, 1);
  }
  else {
    canvas = document.getElementById('dungeonCanvas');
    for (var i = 0; i < 800; i += 1) {
      input_w2[i] = rnd2();
    }

    canvas.width = canvas.width;
    drawToCanvas(canvas, input_w2, 0, 0, 1);
  }

}

function getZero() {
  var canvas;

  if (firstFrame == true) {
    canvas = document.getElementById('dungeonCanvas0');
    for (var i = 0; i < 800; i += 1) {
      input_w1[i] = 0;
    }

    canvas.width = canvas.width;
    drawToCanvas(canvas, input_w1, 0, 0, 1);
  }
  else {
    canvas = document.getElementById('dungeonCanvas');
    for (var i = 0; i < 800; i += 1) {
      input_w2[i] = 0;
    }

    canvas.width = canvas.width;
    drawToCanvas(canvas, input_w2, 0, 0, 1);
  }

}

function getLerp() {
  var lerpArray = [];
  var temp;
  var canvas = document.getElementById('lerpCanvas');
  canvas.width = canvas.width;

  drawToCanvas(canvas, input_w1, 0, 0);
  drawToCanvas(canvas, input_w2, 64 * 8, 0);

  for (var i = 0; i < 7; i += 1) {
    var t = 0.125 * (i+1);
    temp = lerp(input_w1, input_w2, t);
    drawToCanvas(canvas, temp, 64 * (i+1), 0);
  }
}

function getSlerp() {
  var lerpArray = [];
  var temp;
  var canvas = document.getElementById('slerpCanvas');
  canvas.width = canvas.width;

  drawToCanvas(canvas, input_w1, 0, 0);
  drawToCanvas(canvas, input_w2, 64 * 8, 0);

  for (var i = 0; i < 7; i += 1) {
    var t = 0.125 * (i+1);
    temp = slerp(input_w1, input_w2, t);
    drawToCanvas(canvas, temp, 64 * (i+1), 0);
  }
}

function drawToCanvas(canvas, input_w, tx, ty, scale=2) {
  var ctx = canvas.getContext('2d');

  var input = new convnetjs.Vol(1, 1, 800);
  input.w = input_w;

  result = [];
  for (var i = 0; i < 64 * 64; i += 1) {
    result.push(0.0);
  }

  var r;
  // no need to iterate. just multiply!
  // for (var m = 0; m < step; m += 1) {
  //   r = net.forward(input);
  //
  //   for (var i = 0; i < 64 * 64; i += 1) {
  //     result[i] += r.w[i];
  //   }
  // }

  r = net.forward(input);
  for (var i = 0; i < 64 * 64; i += 1) {
    result[i] += r.w[i] * step;
  }

  for (var i = 0; i < 64 * 64; i += 1) {
    // sigmoid
    result[i] = 1.0/(1.0+Math.exp(-result[i]));
  }

  var index;
  var imageIndex;
  var color;
  var g = ctx.createImageData(64 * scale, 64 * scale);

  for (var i = 0; i < 64; i += 1) {
    for (var j = 0; j < 64; j += 1) {

      imageIndex = i + j * 64;
      for (var m = 0; m < scale; m += 1) {
        for (var n = 0; n < scale; n += 1) {
          index = ((i*scale + m) + (j*scale + n) * 64 * scale);

          g.data[index*4+0] = Math.floor(255 * result[imageIndex]);
          g.data[index*4+1] = Math.floor(255 * result[imageIndex]);
          g.data[index*4+2] = Math.floor(255 * result[imageIndex]);
          g.data[index*4+3] = 255; //alpha
        }
      }
    }
  }

  ctx.putImageData(g, tx * scale, ty * scale);
}


function rnd2() {
    return ((Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) - 3) / 3;
}

var result;
var step = 6;
var input_w;
input_w = new Array(800);
for (var i = 0; i < 800; i += 1) {
  // input_w[i] = rnd2() + (rnd2() * rnd2());
  input_w[i] = rnd2();
}


var ori_canvas, nn_canvas, ori_ctx, nn_ctx;

$(function() {

  for (var i = 0; i < 100; i += 1) {
    $('#imageHolder').append("<button type='button' class='button' onclick='setImage(" + (i+1) + ");' id='button" + (i+1).toString() + "'><img src='images/" + (i+1).toString() + ".png' /></button>");
  }

  var image = new Image();
  image.onload = function() {
    ori_canvas = document.getElementById('dungeonCanvas0');
    nn_canvas = document.getElementById('dungeonCanvas');

    ori_ctx = ori_canvas.getContext('2d');
    nn_ctx = nn_canvas.getContext('2d');
    ori_ctx.fillStyle = '#ff0000';
    ori_ctx.fillRect(0, 0, 80, 80);
    ori_ctx.drawImage(image, 8, 8, 64, 64);

    // start the regression!

    nn_ctx.fillStyle = '#0000ff';
    nn_ctx.fillRect(0, 0, 80, 80);
    drawToCanvas(nn_canvas, input_w, 8, 8, 1);

  }
  image.src = 'images/5.png';

  input_w1 = mean['5'];
  input_w2 = input_w;

  firstSelectedIndex = 5;
  $('#button' + firstSelectedIndex.toString()).addClass('red');


  layer_defs = [];
  layer_defs.push({type:'input', sx:1, sy:1, out_sx:1, out_sy:1, out_depth:800});
  layer_defs.push({type:'deconv', sx:8, sy:8, filters:256, stride:1, pad:0, activation:'relu'});
  layer_defs.push({type:'deconv', stride:2, pad:1, sx:4, sy:4, out_sx:16, out_sy:16, filters:128, activation:'relu'});
  layer_defs.push({type:'deconv', stride:2, pad:1, sx:4, sy:4, out_sx:32, out_sy:32, filters:64, activation:'relu'});
  layer_defs.push({type:'deconv', stride:2, pad:1, sx:4, sy:4, out_sx:64, out_sy:64, filters:1});

  net = new convnetjs.Net();
  net.makeLayers(layer_defs);


  net.layers[1].fromJSON(layer_0);
  net.layers[3].fromJSON(layer_1);
  net.layers[5].fromJSON(layer_2);
  net.layers[7].fromJSON(layer_3);


});


$( "input" ).on( "click", function() {
  if ($( "input:checked" ).val() == 'firstChange') {
    firstFrame = true;
  }
  else {
    firstFrame = false;
  }
});

function setImage(idx) {
  var canvas;
  var ctx;

  if (firstFrame == true) {
    if (firstSelectedIndex != -1) {
      $('#button' + firstSelectedIndex.toString()).removeClass('red');
    }
    $('#button' + idx.toString()).addClass('red');
    firstSelectedIndex = idx;

    canvas = document.getElementById('dungeonCanvas0');
    input_w1 = mean[idx.toString()];

    canvas.width = canvas.width;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 80, 80);
    drawToCanvas(canvas, input_w1, 8, 8, 1);
  }
  else {
    if (secondSelectedIndex != -1) {
      $('#button' + secondSelectedIndex.toString()).removeClass('blue');
    }
    $('#button' + idx.toString()).addClass('blue');
    secondSelectedIndex = idx;

    canvas = document.getElementById('dungeonCanvas');
    input_w2 = mean[idx.toString()];

    canvas.width = canvas.width;
    ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(0, 0, 80, 80);
    drawToCanvas(canvas, input_w2, 8, 8, 1);
  }
}

function lerp(z1, z2, t) {
  //z1 - 0, z2 - 1
  var z = [];
  var len1 = z1.length;
  var len2 = z2.length;

  if (len1 != len2) {
    return z1;
  }

  for (var i = 0; i < len1; i += 1) {
    z.push(z1[i] + (z2[i] - z1[i]) * t);
  }

  return z;
}

function slerp(z1, z2, t) {
  var len1 = z1.length;
  var len2 = z2.length;
  if (len1 != len2) {
    return z1;
  }

  var mag1 = 0.0;
  var mag2 = 0.0;

  for (var i = 0; i < len1; i += 1) {
    mag1 += z1[i] * z1[i];
  }
  mag1 = Math.sqrt(mag1);

  for (var i = 0; i < len2; i += 1) {
    mag2 += z2[i] * z2[i];
  }
  mag2 = Math.sqrt(mag2);

  var dotp = 0.0;
  for (var i = 0; i < len1; i += 1) {
    dotp += z1[i] / mag1 * z2[i] / mag2;
  }

  if (dotp > 0.9999 || dotp < -0.9999) {
    if (t <= 0.5) {
      return z1;
    }
    return z2;
  }

  var theta = Math.acos(dotp * Math.PI / 180.0);
  var z = [];
  for (var i = 0; i < len1; i += 1) {
    z.push( (z1[i] * Math.sin(1-t) * theta + z2[i] * Math.sin(t * theta)) / Math.sin(theta) );
  }

  return z;

}
