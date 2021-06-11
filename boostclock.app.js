{
  var minutes;
  var seconds;
  var hours;
  var date;
  var first = true;
  var locale = require('locale');
  var _12hour = (require("Storage").readJSON("setting.json", 1) || {})["12hour"] || false;
  var ticksToDraw = 45;

  //Screen dimensions
  const screen = {
    width: g.getWidth(),
    height: g.getWidth(),
    middle: g.getWidth() / 2,
    center: g.getHeight() / 2,
  };

  const maxQuantity = 45;
  const startAngle = 95;
  const maxAngle = 221;
  const step = maxAngle / maxQuantity;
  const angleOffset = 1.3;
  const centerOffset = 12 + 2*angleOffset;
  const centerX = screen.middle;
  const centerY = screen.center + centerOffset;
  const black = {r:0,g:0,b:0};

  // Settings
  const settings = {
    tick: {
      startColor: {
        r: 0.97,
        g: 0.55,
        b: 0.09,
      },
      endColor: {
        r: 1,
        g: 0.87,
        b: 0.50,
      },
      topColor: {
        r: 1,
        g: 0.70,
        b: 0.62,
      },
      font: 'Vector',
      baseRadius: 80,
    },
  };

  const getColor = function(tickNumber) {
    ratio = tickNumber/36;
    red = ratio*(settings.tick.endColor.r - settings.tick.startColor.r) + settings.tick.startColor.r;
    green = ratio*(settings.tick.endColor.g - settings.tick.startColor.g) + settings.tick.startColor.g;
    blue = ratio*(settings.tick.endColor.b - settings.tick.startColor.b) + settings.tick.startColor.b;
    return {r:red,g:green,b:blue};
  };

  const getArcXY = function (radius, angle) {
    var s, r = [];
    s = 2 * Math.PI * angle / 360;
    r.push(centerX + Math.round(Math.cos(s) * radius));
    r.push(centerY + Math.round(Math.sin(s) * radius));

    return r;
  };

  const drawTick = function(radius, angle, length){
    p1 = getArcXY(radius, angle-angleOffset);
    p2 = getArcXY(radius, angle+angleOffset);
    p3 = getArcXY(radius + length, angle+angleOffset);
    p4 = getArcXY(radius + length, angle-angleOffset);
    poly = [p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]];
    g.fillPoly(poly);
  };

  const drawTickIndex = function(i, color) {
      g.setColor(color.r, color.g, color.b);
      radius = settings.tick.baseRadius + i/4;
      if (i < 18){
        length = 6 + i/3.5;
      }
      else if (i < 36) {
        length = 6 + i/2;
        radius -= 0.2*(i-18);
      }
      else {
        length = 28;
        radius -= 0.2*(i-18) + 0.2*(i-36);
      }
      drawTick(radius, startAngle + step*i, length);
  };
  const drawCircle = function () {
    g.setColor('#FFFFFF');
    g.drawImage(require("Storage").read("boostclock.gauge.img"), 12, 12);
    g.setColor(settings.tick.startColor);
    for (i = 0; i < ticksToDraw; i++){
      if (i < 36) {
        drawTickIndex(i, getColor(i));
      }
      else {
        drawTickIndex(i, settings.tick.topColor);
      }
    }
    //g.fillCircle(settings.circle.middle, settings.circle.center, screen.middle-20);
  };

  var lastTickLevel = maxQuantity;
  const newBeats = function (hr) {
    ticksToDraw = Math.min(45, Math.round((hr.bpm/200)*45));

    if (ticksToDraw < lastTickLevel){
      for (startIndex = lastTickLevel; startIndex >= ticksToDraw; startIndex--){
        drawTickIndex(startIndex, black);
      }
    }
    else {
      for (startIndex = lastTickLevel; startIndex < ticksToDraw; startIndex++){
        if (startIndex < 36) {
          drawTickIndex(startIndex, getColor(startIndex));
        } else {
          drawTickIndex(startIndex, settings.tick.topColor);
        }
      }
    }
    lastTickLevel = ticksToDraw;
  };

  var lastTime = "--:--";
  const drawClock = function() {

    var d = new Date();
    var hours = d.getHours();
    if (_12hour) hours = ((hours + 11) % 12) + 1;
    var t = (" "+hours).substr(-2)+":"+
            ("0"+d.getMinutes()).substr(-2);
    if (t != lastTime){

      if (typeof locale.meridian === "function") {
        meridian = locale.meridian(d);
      } else {
        meridian = "";
      }

      g.reset();
      g.drawImage(require("Storage").read("boostclock.bg.img"), centerX-76, centerY-76);

      g.setFontAlign(0,0,0);
      g.setColor(1, 0.92, 0.55);
      g.setFont("Vector", 50);
      g.drawString(t, centerX, centerY);

      g.setFont("Vector", 25);
      g.drawString(meridian, centerX, centerY + 30);

      g.setFont("Vector", 15);
      var date = locale.date(d,1);
      g.drawString(date, centerX, centerY - 35);

      lastTime = t;
    }
  };

  // manage when things should be enabled and not
  Bangle.on('lcdPower', function (on) {
    if (on) {
      Bangle.setHRMPower(1, "boostclock");
    } else {
      Bangle.setHRMPower(0, "boostclock");
    }
  });

  // clean app screen
  g.clear();
  Bangle.loadWidgets();
  Bangle.drawWidgets();


  // check time every second
  setInterval(drawClock, 1000);

  // start HR monitor and update frequency of update
  Bangle.setHRMPower(1);
  Bangle.on('HRM', function (d) {
    newBeats(d);
  });

  // draw now
  drawCircle();
  drawClock();

  // Show launcher when middle button pressed
  setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: "falling" });

} 